<?php
/**
 * Tag Bandit plugin
 *
 * @version $Id$
 * @copyright Center for History and New Media, 2009
 * @license http://www.gnu.org/licenses/gpl-3.0.txt
 */
 
define('TAG_BANDIT_PLUGIN_DIR', dirname(__FILE__));

add_plugin_hook('install', 'tag_bandit_install');
add_plugin_hook('uninstall', 'tag_bandit_uninstall');
add_plugin_hook('admin_append_to_items_browse_primary', 'tag_bandit_item_tags');

function tag_bandit_install()
{   
}

function tag_bandit_uninstall()
{
    // Delete the any tag bandit background process records
    $processes = get_db()->getTable('Process')->findByClass('TagBandit_AddTagsProcess');
    foreach($processes as $process) {
        $process->delete();
    }
}

function tag_bandit_item_tags()
{
    $_SESSION['tag_bandit_item_query'] = $_GET;
    $_SESSION['tag_bandit_item_query_controller_name'] = Omeka_Context::getInstance()->getRequest()->getControllerName();
?>
    <h2>Add Or Remove Tags To These Items</h2>
    <form method="post" action="<?php echo html_escape(uri('tag-bandit/index/batch')); ?>">
        <div>
            <input type="text" name="tag_bandit_tags" value="" id="tag_bandit_tags" />
            <input type="submit" name="tag_bandit_add_tags_submit" value="Add Tags" />
            <input type="submit" name="tag_bandit_delete_tags_submit" value="Delete Tags" />
        </div>
    </form>
<?php
}