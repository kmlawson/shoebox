<?php
/**
 * The Tag Bandit index controller class.
 * @version $Id$
 * @copyright Center for History and New Media, 2009
 * @author CHNM
 * @license http://www.gnu.org/licenses/gpl-3.0.txt
 * @package TagBandit
 */
 
class TagBandit_IndexController extends Omeka_Controller_Action
{
    const ITEMS_PER_PAGE = 30;
    
    public function batchAction()
    {   
        // get the tags to add
        $tags = $this->_getTags($_POST['tag_bandit_tags']);
     
        if (count($tags) > 0) {
               
             // get the item query which defines the set of items to tag
             $params = $_SESSION['tag_bandit_item_query'];

             // get the item query controller name
             $controllerName = $_SESSION['tag_bandit_item_query_controller_name'];

             // get the current user
             $user = current_user();

             // create the arguments for the background process which adds the tags
             $args = array();
             $args['tags'] = $tags;
             $args['user_id'] = $user->id;        
             $args['params'] = $params;
             $args['items_per_page'] = self::ITEMS_PER_PAGE;
             $args['controller_name'] = $controllerName;

             // start the background process which adds or deletes the tags
             if (isset($_POST['tag_bandit_add_tags_submit'])) {
                 ProcessDispatcher::startProcess('TagBandit_AddTagsProcess', $user, $args);
                 $this->flashSuccess('We started adding tags to the items you selected.');
             } else if (isset($_POST['tag_bandit_delete_tags_submit'])) {
                 $args['delete_all'] = (bool)$_POST['tag_bandit_delete_all'];
                 ProcessDispatcher::startProcess('TagBandit_DeleteTagsProcess', $user, $args);
                 $this->flashSuccess('We started deleting tags from the items you selected.');
             }
         } else {
             $this->flashError('You must specify at least one tag to ' . $actionName . '.');
         }
     
         // unset the session variable which holds the item query
         unset($_SESSION['tag_bandit_item_query']);
         unset($_SESSION['tag_bandit_item_query_controller_name']);

         $this->_redirect($_SERVER['HTTP_REFERER']);
    }
    
    private function _getTags($tagString)
    {
        $tagsRaw = explode(',',trim($tagString));
        $tags = array();
        foreach($tagsRaw as $tagRaw) {
            $tags[] = trim($tagRaw);
        }
        return $tags;
    }
}