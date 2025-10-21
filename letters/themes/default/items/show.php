<?php head(array('title' => item('Dublin Core', 'Title'),'bodyid'=>'items','bodyclass' => 'show')); ?>


   <div id="primary">
        <h1><?php echo item('Dublin Core', 'Title'); ?></h1>

        <?php
        $titles = item('Dublin Core', 'Title', 'all');

        if (count($titles) > 1):

        ?>

        <h2>All Titles</h2>	
    	<ul class="title-list">
            <?php foreach ($titles as $title): ?>
               <li class="item-title">
               <?php echo $title; ?>
               </li>
            <?php endforeach; ?>
    	</ul>
        <?php endif; ?>
		
        <div class="item hentry">
             <div class="item-meta">
				<?php while(loop_files_for_item()): ?>
		
                   <div class="item-img">	<?php 
				        $file = get_current_file();
				        if ($file->hasThumbnail()):
			            echo display_file($file,array('imageSize'=>'fullsize'));
			            endif;
			        ?>					
				   </div>
				
				<?php endwhile; ?>

                <?php echo show_item_metadata(); ?>
			
		        
				
				<h3>Files</h3>
				<ul class="title-list">
			 <!-- The following returns all of the files associated with an item. -->	
				<?php $hasShownFile = false; ?>

			  	<?php while(loop_files_for_item()): ?>
					<li class="item-title">
				    <?php 
				        $file = get_current_file();
				        if (!$file->hasThumbnail()):
				          echo display_file($file);
				          $hasShownFile = true;
				        endif;
				    ?>
					</li>


				<?php endwhile; ?>
				
				
				<?php if (!$hasShownFile): ?>
				    <li class="item-title">No files are associated with this item.</li>
			    <?php endif; ?>
			 </ul>
			
			
					<?php if(item_has_tags()): ?>
					<h3>Tags</h3>
					<ul class="title-list">
					<li class="item-title"><?php echo item_tags_as_string(); ?></li></ul>
					<?php endif;?>

					<h3>Citation</h3>
					<ul class="title-list">
			         <li class="item-title"><?php echo item_citation(); ?></li></ul>


					<?php if (item_belongs_to_collection()): ?>
			         <h3>Collection</h3>
			<ul class="title-list">
			         <li><?php echo link_to_collection_for_item(); ?></li></ul>
			         <?php endif; ?>

					 <?php if (item_has_type()): ?>
			         <h3>Item Type</h3><ul class="title-list">
			         <li class="item-title"><?php echo item('Item Type Name'); ?></li>
			         <?php endif; ?>
			
			<p><em>Are there tags that should be added? Translation off?<br />
			<a href="http://huginn.net/shoebox/feedback/?title=<?php echo urlencode(item('Dublin Core','Title')); ?>&item=<?php echo urlencode(item_uri()); ?>">Send us a Correction or Suggestion</a> about this item.</p>
             </div>  <!-- end item-meta -->  
			
        </div><!-- end item hentry --> 

		<?php echo plugin_append_to_items_show(); ?>
              
		<ul class="item-pagination navigation">
		<li id="previous-item" class="previous">
			<?php echo link_to_previous_item('Previous Item'); ?>
		</li>
		<li id="next-item" class="next">
			<?php echo link_to_next_item('Next Item'); ?>
		</li>
		</ul>  
              
   </div>
         <!-- end #primary-->
   <div id="secondary">
       
        </div> <!-- end show-sidebar -->
   </div> <!-- end #secondary -->
<?php foot(); ?>