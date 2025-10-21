<!-- 
    Sort Browse Results needs to be invoked from within the theme.
    Copy and paste the following into /themes/myTheme/items/browse.php
    (Between the pagination and the items)

    $sortBy->get_link(@param)
    @param is a string representing the value to sort on. E.g. 'title'
    The plugin will first check the element_texts table (Dublin Core) then check the items table 
    except where @param = 'type' in which case the plugin will only use the items table. (Omeka item_type)
    
    This behaviour can be overridden by pre-pending dc. or omeka.
    E.g. omeka.modified will sort on the modified value in the items table.
    or   dc.type will sort based on the Dublin Core 'type' instead of the Omeka item_type
-->

<?php $sortBy = new SortBy; // requires Sort Browse Results Plugin ?>
<ul class="sort-options">
    <li class="title <?php echo $sortBy->get_cssclass("title"); ?>"><a href="<?php echo $sortBy->get_link('dc.title'); ?>" title="Sort by title">Title</a></li>
    <li class="type <?php echo $sortBy->get_cssclass("type"); ?>"><a href="<?php echo $sortBy->get_link('type'); ?>" title="Sort by type">Type</a></li>
    <li class="date <?php echo $sortBy->get_cssclass("omeka.modified"); ?>"><a href="<?php echo $sortBy->get_link('omeka.modified'); ?>" title="Sort by modified">Date</a></li>
</ul>