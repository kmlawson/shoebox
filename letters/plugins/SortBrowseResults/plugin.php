<?php
/**
 * For Omeka 0.10
 * Allows sorting of results on the browse items page
 * See themeExampleHTML.txt for code to be placed into /themes/myTheme/items/browse.php
 * 
 * @param get['sortby']
 * will first check element_texts for @param
 * then will check items table
 * except if @param == type, will check items table
 * can be prefixed with dc. or omeka. to force behaviour
 
 */

define('SORTBROWSERESULTS_PLUGIN_VERSION', '0.2');

add_plugin_hook('install', 'sortbrowse_install');
add_plugin_hook('uninstall', 'sortbrowse_uninstall');
add_plugin_hook('item_browse_sql', 'sortbrowse');

function sortbrowse_install()
{
    set_option('sortbrowseresults_plugin_version', SORTBROWSERESULTS_PLUGIN_VERSION);
}

function sortbrowse_uninstall()
{
    delete_option('sortbrowseresults_plugin_version');
}

function sortbrowse($select, $params)
{
    // determine whether to sort using the element_texts (Dublin Core) 
    // or
    // Items table (item_type | modified | added | collection_id)
    // 'type' defaults to items table
    $sortTerm = explode("."  , $_GET['sortby'] ,2 );
    if (sizeof($sortTerm) === 2) {
        $includesElementSet = true;
    } else if ($_GET['sortby']){
        $isSingleValue = true;
    }

    if ($includesElementSet) { 
        $sortOrder = strtolower($sortTerm[1]);
        if ($sortTerm[0] === 'dc') {
            sort_by_dc($select, $sortOrder);    
        } else if($sortTerm[0] === 'omeka') {
            sort_by_omeka($select, $sortOrder);
        }
    }  else if ($isSingleValue) {
        $sortOrder = strtolower($sortTerm[0]);
        if ($sortOrder === 'type'){
            //  use items table (default is omeka.item_type)
            sort_by_omeka($select, 'item_type_id');
        } else {
            // tries element_texts table, then items table
            sort_by_dc($select, $sortOrder);
        }
    } 
    // do nothing if $_GET['sortby'] is empty
}
 
/** 
 * Retrieve the element_id from the element table
 * 
 * @return integer or null
 * @param string $sortOrder
 */
function get_element_id($sortOrder){
    $table = get_db()->getTable('Element');
    $selectq = $table->getSelect();
    $selectq->where('e.name = ?', $sortOrder);
    
    return  $table->fetchObject($selectq)->id;
}
/**
 * 
 * @return array 
 * @param object $select
 * @param object $sortOrder
 */
function get_sort_order($select, $sortOrder){
    switch ($_GET['sortorder']){
        case 'desc':
            $dir = "DESC";
            break;
        default:
           $dir = "ASC";
            break;
    }
    
    // if order is already set, i.e. search rank 
    // prepend order with new order
    // TODO: Verify this actually works
    $orderArray = $select->getPart('order');
    if (sizeof($orderArray) > 0) {
        $orderArray = Array($orderArray[0][0] . " " . $orderArray[0][1]);
    }
    
    array_unshift($orderArray, $sortOrder. ' ' .$dir);
    return $orderArray;
}

/**
 * 
 * @return nothing
 * @param object $select
 * @param object $sortOrder
 */
function sort_by_dc($select, $sortOrder){
    $meta_id = get_element_id($sortOrder);
    
    if(empty($meta_id)){
        sort_by_omeka($select, $sortOrder);
        return;
    }
    $db = Omeka_Context::getInstance()->getDb(); 
    
    $orderArray = get_sort_order($select, 'et.text');
    $select->reset('order');
    $select->joinLeft(array('et'=>$db->ElementText), "et.record_id = i.id AND et.element_id =".$meta_id, array("et.text"))->order($orderArray);
}

/**
 * 
 * @return nothign
 * @param object $select
 * @param object $sortOrder
 */
function sort_by_omeka($select, $sortOrder){
    // check sortOrder is a colName
    $validCols = Array('id', 'item_type_id', 'modified', 'added', 'collection_id', 'featured', 'public');
    if (!in_array($sortOrder, $validCols)){
        return;
    }
    
    $orderArray = get_sort_order($select, $sortOrder);
    $select->reset('order');
    $select->order($orderArray);
}
    
    
    
 /**
  * Functions used in the UI
  */   
class SortBy
{   
    /**
     * Retrieve the uri for the link
     * 
     * @param string $elementName
     * @return string
     **/
    public function get_link($sort){
        $sortparams = $this->_get_sortparams();
        $file_path = str_replace( $_SERVER['QUERY_STRING']  , "" , $_SERVER['REQUEST_URI']);
        
        if ($sort == $sortparams['sortby'] && $sortparams['sortorder'] != 'desc' ){
            $dir = "&amp;sortorder=desc";
        } 
        
        return $file_path.$sortparams['querystring'] . "sortby=$sort$dir";
    }
    
    /**
     * Retrieve the CSS Class Name for the link
     * 
     * @param string $elementName
     * @return string
     **/
    public function get_cssclass($sort){
        $sortparams = $this->_get_sortparams();
        
        if ($sortparams['sortby']== $sort && $sortparams['sortorder'] == "desc"){
            $sort_cssclass = "active-desc";
        } else if ($sortparams['sortby']== $sort){
            $sort_cssclass = "active-asc";
        } else {
            $sort_cssclass = "normal";
        }
        
        return $sort_cssclass;
    }

    private function _get_sortparams(){
        try {
            $sortparams = Zend_registry::get('sortparams');
        }
            
        catch(Exception $e) {
            // split the querystring from the uri 
            // remove and store the sortby or sortorder params separately
            // rebuild and store the remainder of the querystring
            empty($_GET) ? $qs = "?" : $qs = ""; 
            
            $sortparams = array('sortby'=>$_GET['sortby'], 'sortorder'=>$_GET['sortorder']);
            unset($_GET['sortby']);
            unset($_GET['sortorder']);
            foreach($_GET as $key=>$val){
                $qs.= "$key=$val&amp;"; 
            }
            $sortparams['querystring']=$qs;
            Zend_registry::set('sortparams', $sortparams);
        }
        return $sortparams;
    }
}