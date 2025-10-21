<?php
/**
 * A background process to delete tags from a set of items
 * 
 * @version $Id$
 * @copyright Center for History and New Media, 2009
 * @license http://www.gnu.org/licenses/gpl-3.0.txt
 * @package Omeka
 * @subpackage Models
 */

class TagBandit_DeleteTagsProcess extends ProcessAbstract
{
    public function run($args)
    {
        $db = get_db();
        
        $params = $args['params'];
        $controllerName = $args['controller_name'];
        $tags = $args['tags'];
        $itemsPerPage = $args['items_per_page'];
        $userId = $args['user_id'];
        $user = $db->getTable('User')->find($userId);
        $deleteAll = (bool) $args['delete_all'];
        
        if (!empty($params) && 
            $controllerName == 'search' &&
            class_exists('LuceneSearch_Search') && 
            $search = LuceneSearch_Search::getInstance()) {

            $hits = $search->getLuceneSearchHits($params);
            foreach($hits as $hit) {
                $record = lucene_search_get_record_for_search_hit($hit);
                $record->deleteTags($tags, $user, $deleteAll);               
                release_object($record);
            }            
        } else {
            $itemTable = $db->getTable('Item');
            $itemCount = $itemTable->count($params);        
            $maxPages = (int) ceil((float)$itemCount / $itemsPerPage);
            for ($i = 1; $i <= $maxPages; $i++) {
                $select = $itemTable->getSelect();
                $itemTable->applySearchFilters($select, $params);
                $select->limitPage($i, $itemsPerPage);
                $items = $itemTable->fetchObjects($select);
                foreach($items as $item) {
                    $item->deleteTags($tags, $user, $deleteAll);           
                    release_object($item);
                }
            }
        }
    }
}