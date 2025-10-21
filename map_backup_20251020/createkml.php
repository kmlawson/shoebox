<?php


$csvfile='locations.csv';


$fileasarray=file($csvfile);
if (!$fileasarray) {
	exit('File could not be found or read.');
}

// Creates the Document.
$dom = new DOMDocument('1.0', 'UTF-8');

// Creates the root KML element and appends it to the root document.
$node = $dom->createElementNS('http://www.opengis.net/kml/2.2', 'kml');
$parNode = $dom->appendChild($node);

// Creates a KML Document element and append it to the KML element.
$dnode = $dom->createElement('Document');
$docNode = $parNode->appendChild($dnode);

// Creates the two Style elements, one for restaurant and one for bar, and append the elements to the Document element.

/*
$restStyleNode = $dom->createElement('Style');
$restStyleNode->setAttribute('id', 'chosenIcon');
$restIconstyleNode = $dom->createElement('IconStyle');
$restIconstyleNode->setAttribute('id', 'placeIcon');
$restIconNode = $dom->createElement('Icon');
$restHref = $dom->createElement('href', 'http://maps.google.com/mapfiles/kml/pal2/icon63.png');
$restIconNode->appendChild($restHref);
$restIconstyleNode->appendChild($restIconNode);
$restStyleNode->appendChild($restIconstyleNode);
$docNode->appendChild($restStyleNode);
*/


// Iterates through the MySQL results, creating one Placemark for each row.
foreach ($fileasarray as $locationdata)
{
	//Transform the CSV data from the line into an array we can work with.
	$row=explode(',',$locationdata);
	
  // Creates a Placemark and append it to the Document.

  $node = $dom->createElement('Placemark');
  $placeNode = $docNode->appendChild($node);

  // Creates an id attribute and assign it the value of name column. NOTE: doesn't check for duplicates
  // $placeNode->setAttribute('id', htmlentities($row[0],ENT_QUOTES,'UTF-8'));

  // Create name, and description elements and assigns them the values of the name and address columns from the results.
  $nameNode = $dom->createElement('name',$row[0]);
  $placeNode->appendChild($nameNode);
  $descNode = $dom->createElement('description', '<p>'.$row[1].'</p><p>Items tagged <a href="http://huginn.net/shoebox/letters/items/browse?tags='.urlencode($row[0]).'">'.$row[0]."</a>");
  $placeNode->appendChild($descNode);
  //$styleUrl = $dom->createElement('styleUrl', '#' . 'icon' . 'Style');
  //$placeNode->appendChild($styleUrl);

  // Creates a Point element.
  $pointNode = $dom->createElement('Point');
  $placeNode->appendChild($pointNode);

  // Creates a coordinates element and gives it the value of the lng and lat columns from the results.
  $coorStr = trim($row[3]) . ','  . $row[2];
  $coorNode = $dom->createElement('coordinates', $coorStr);
  $pointNode->appendChild($coorNode);
}

$kmlOutput = $dom->saveXML();
$myfile="locations.kml";
$fh=fopen($myfile, 'w') or die("can't open file");
fwrite($fh, $kmlOutput);
fclose($fh);
echo "Done.";
?>