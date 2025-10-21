<?php 
/**
 * @version $Id$
 * @copyright Center for History and New Media, 2009-2010
 * @license http://www.gnu.org/licenses/gpl-3.0.txt
 * @package Omeka
 * @access private
 */

/**
 * Front controller resource.
 *
 * @internal This implements Omeka internals and is not part of the public API.
 * @access private
 * @package Omeka
 * @copyright Center for History and New Media, 2009-2010
 */
class Omeka_Core_Resource_Frontcontroller extends Zend_Application_Resource_Frontcontroller
{
    /**
     * @return Zend_Controller_Front
     */
    public function init()
    {           
        $front = Zend_Controller_Front::getInstance();
        
        // If 'skipOmekaMvc' is set on the front controller, skip the
        // Omeka custom behavior here, and stick with vanilla Zend.
        // Because of resource naming conflicts, i.e. both Zend and Omeka 
        // resource plugins called 'Frontcontroller', there is no easy way to
        // use the default Zend resource instead of Omeka's.  Situations where
        // this would be useful include installation of Omeka, or in any future
        // modules that want to bypass the dependency graph of Omeka in favor
        // of using the (relatively) simpler Zend Framework defaults.
        if ($front->getParam('skipOmekaMvc')) {
            return parent::init();
        }
        
        // Plugin broker is required to set plugin-defined response contexts
        $bootstrap = $this->getBootstrap();
        if ($bootstrap->hasPluginResource('PluginBroker')) {
            $bootstrap->bootstrap('PluginBroker');
        }
                
        // Front controller
        $front->addControllerDirectory(CONTROLLER_DIR, 'default');
                                                        
        // Action helpers
        $this->initializeActionHelpers();
        
        // Register the JSOND controller plugin
        $front->registerPlugin(new Omeka_Controller_Plugin_Jsonp);
        
        $front->registerPlugin(new Omeka_Controller_Plugin_Upgrade);
        
        return $front;
    }
    
    /**
     * Set up Omeka custom action helpers.
     *
     * @return void
     */
    private function initializeActionHelpers()
    {
        $this->initViewRenderer();
        $this->initResponseContexts();
        $this->initSearchHelper();
    }
    
    /**
     * Add item search helper.
     *
     * @return void
     */
    private function initSearchHelper()
    {
        $searchHelper = new Omeka_Controller_Action_Helper_SearchItems;
        Zend_Controller_Action_HelperBroker::addHelper($searchHelper);
    }
    
    /**
     * Set up Zend view renderer to use Omeka classes and conventions.
     *
     * @return void
     */
    private function initViewRenderer()
    {
        $viewRenderer = Zend_Controller_Action_HelperBroker::getStaticHelper('viewRenderer');
        $view = new Omeka_View();
        $viewRenderer->setView($view)
                     ->setViewSuffix('php');  
                     
        // Register the view object so that it can be called by the view helpers.
        Zend_Registry::set('view', $view);   
    }
    
    /**
     * Define the custom response format contexts for Omeka.
     * 
     * Plugin writers should use the 'define_response_contexts' filter to modify
     * or expand the list of formats that existing controllers may respond to.
     *
     * @link http://framework.zend.com/manual/en/zend.controller.actionhelpers.html#zend.controller.actionhelpers.contextswitch
     * 
     * Example of a definition of a response context through the ZF API:
     * 
     * <code> 
     * $contexts->addContext('dc', array(
     *    'suffix'    => 'dc',
     *    'headers'   => array('Content-Type' => 'text/xml'),
     *    'callbacks' => array(
     *        'init' => 'atBeginningDoThis',
     *        'post' => 'afterwardsDoThis'
     *    ) 
     *  ));
     * </code>
     * 
     * @return void
     */    
    private function initResponseContexts()
    {        
        Zend_Controller_Action_HelperBroker::addHelper(new Omeka_Controller_Action_Helper_ContextSwitch);
        $contexts = Zend_Controller_Action_HelperBroker::getStaticHelper('contextSwitch');
                
        $contexts->setContextParam('output');
                
        $contextArray = self::getDefaultResponseContexts();

        if ($pluginBroker = $this->getBootstrap()->getResource('PluginBroker')) {             
            $contextArray = $pluginBroker->applyFilters('define_response_contexts', $contextArray);
        }
                        
        $contexts->addContexts($contextArray);
    }       
    
    
    /**
     * Return the default response contexts for Omeka.
     * 
     * @return array
     */
    static public function getDefaultResponseContexts()
    {
        return array(
             'omeka-xml' => array(
                'suffix'  => 'omeka-xml', 
                'headers' => array('Content-Type' => 'text/xml')
             ), 
             'omeka-json' => array(
                'suffix' => 'omeka-json', 
                'headers' => array('Content-Type' => 'application/json')
             ), 
             'dcmes-xml' => array(
                 'suffix'    => 'dcmes-xml',
                 'headers'   => array('Content-Type' => 'text/xml')
             ),
             'rss2' => array(
                 'suffix'    => 'rss2',
                 'headers'   => array('Content-Type' => 'text/xml')
             )
         );
    }
}
