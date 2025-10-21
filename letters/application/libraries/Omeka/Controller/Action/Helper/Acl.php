<?php
/**
 * @version $Id$
 * @copyright Center for History and New Media, 2007-2010
 * @license http://www.gnu.org/licenses/gpl-3.0.txt
 * @package Omeka
 */

/**
 * Leverages the ACL to automatically check permissions for the current 
 * controller/action combo.
 *
 * @uses Omeka_Acl
 * @package Omeka
 * @copyright Center for History and New Media, 2007-2010
 */
class Omeka_Controller_Action_Helper_Acl extends Zend_Controller_Action_Helper_Abstract
{
    /**
     * ACL object.
     *
     * @var Omeka_Acl
     */
    protected $_acl;

    /**
     * Temporarily allowed permissions.
     *
     * @var array
     */
    protected $_allowed = array();
    
    /**
     * Instantiated with the ACL permissions which will be used to verify 
     * permission levels.
     * 
     * @param Omeka_Acl $acl
     */
    public function __construct($acl)
    {
        $this->_acl = $acl;
    }
    
    /**
     * Called just before dispatching.
     * Redirects to a 403 error page when an action is forbidden to the user.
     *
     * @return void
     */
    public function preDispatch()
    {
        try {
            $this->checkActionPermission($this->getRequest()->getActionName());
        } catch (Omeka_Controller_Exception_403 $e) {
            $this->getRequest()->setControllerName('error')->setActionName('forbidden')->setModuleName('default')->setDispatched(false);
            // Here's a (kind of) hack that lets this happen.
            $this->_allowed['forbidden'] = true;
        }
    }
    
    /**
     * Check whether an action is allowed.
     * Throws an exception when not allowed.
     *
     * @param string $action
     * @return void
     */
    protected function checkActionPermission($action)
    {   
        //Here is the permissions check for each action
        try {
            if(!$this->isAllowed($action)) {        
                throw new Omeka_Controller_Exception_403();
            }
        } 
        //Silence exceptions that occur when an action has no equivalent privilege in the ACL
        catch (Zend_Acl_Exception $e) {}        
    }
    
    /**
     * Notify whether the logged-in user has permission for the given privilege.
     * i.e., if the $privilege is 'edit', then this will return TRUE if the user
     * has permission to 'edit' for the current controller.
     *
     * @param string $privilege Privilege to check.
     * @param string $resource (optional) Resource name.  The resource for the
     * current controller will be used if this is omitted.
     * @return boolean
     */
    public function isAllowed($privilege, $resource = null) 
    {
        $allowed = $this->_allowed;
        if(isset($allowed[$privilege])) {
            return $allowed[$privilege];
        }
        
        if(!$resource) {
            $resource = $this->getResourceName();
        }

        // If the resource has not been defined in the ACL, allow access to the
        // controller.
        if (!$this->_acl->has($resource)) {
            return true;
        }        

        // If the resource exists (Controller) but the tested privilege (action)
        // has not been defined in the ACL, then allow access.        
        if(($resource = $this->_acl->get($resource)) && (!$resource->has($privilege))) {
            return true;
        }
        
        return $this->_acl->checkUserPermission($resource, $privilege);
    }
    
    /**
     * Retrieve the name of the ACL resource based on the name of the controller 
     * and, if not the default module, the name of the module.
     *  
     * @todo Should use the Zend inflection, though mine works better at the moment [KBK].
     * @return string
     */
    public function getResourceName()
    {
        $controllerName = $this->getRequest()->getControllerName();
        $moduleName     = $this->getRequest()->getModuleName();
        
        // This ZF inflector should work but it doesn't!
        // $inflector = new Zend_Filter_Word_DashToCamelCase();
        // return $inflector->filter($controllerName);
        // Instead we are going to inflect from dashed-lowercase to CamelCase.
        $inflectedControllerName = implode('', array_map('ucwords', explode('-', $controllerName)));
        
        if ('default' == $moduleName) {
            // This is the default moduloe, so there is no need to add a 
            // namespace to the resource name.
            $resourceName = $inflectedControllerName;
        } else {
            // This is not a default module (i.e. plugin), so we need to add a 
            // namespace to the resource name.
            $inflectedModuleName = implode('', array_map('ucwords', explode('-', $moduleName)));
            $resourceName = $inflectedModuleName . '_' . $inflectedControllerName;
        }
        return $resourceName;
    }
    
    /**
     * Temporarily override the ACL's permissions for this controller
     *
     * @param string $rule
     * @param boolean $isAllowed
     */
    public function setAllowed($rule, $isAllowed = true) 
    {
        $this->_allowed[$rule] = $isAllowed;
    }    
}
