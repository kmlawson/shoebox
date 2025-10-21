<?php 
$tab=chr(9);
$item=urldecode($_GET["item"]);
$title=urldecode($_GET["title"])?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><link href="http://huginn.net/shoebox/styles.css" rel="stylesheet" type="text/css" />
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1" />
<title>Send a Correction or Suggestion: <?php echo $title; ?></title>

<script type="text/javascript">
<!--

function validate_form ( )
{
    valid = true;

    if ( document.sender.name.value == "" )
    {
        alert ( "You must include your name." );
        valid = false;
    }
	if ( document.sender.zaemail.value == "" )
    {
		if (valid==true)
        { alert ( "You must include your email address." );
          valid = false;
		}
    }
	if ( document.sender.Message.value == "" )
    {
		if (valid==true)
        alert ( "Your message cannot be completely blank." );
        valid = false;
    }
    return valid;
}

//-->
</script>
		<style type="text/css" media="screen"><!--

--></style>
	</head>
<body>

<form name="sender" method="post" enctype="multipart/form-data" action="http://huginn.net/shoebox/f/f.php" onsubmit="return validate_form();" style="font-size: 18px;">
  <p>
  <input type="hidden" name="MAX_FILE_SIZE" value="1000000">
  <input type="hidden" name="path_to_file" value="/www/uploaded/files">
  <input type="hidden" name="require" value="email,name">
  <input type="hidden" name="sort" value="alphabetic">
  <input type="hidden" name="env_report" value="REMOTE_HOST,HTTP_USER_AGENT">
  <input type="hidden" name="item" value="<?php echo urlencode($item); ?>">
  <input type="hidden" name="title" value="<?php echo urlencode($title); ?>">
  </p>
  <p><strong>Shoebox of Norwegian Letters - Suggestions and Corrections</strong></p>
  <p>Submitting a suggestion or correction for:<br /> <a style="font:'Courier';" href="<? echo $item; ?>"><? echo $title; ?></a></p>
 <p>As you make your suggestion please keep the following in mind: The original Norwegian text of the Stj&oslash;rdal-South Dakota Collection has been transcribed as is from the letters, which often contained mistakes in spelling, grammar, etc. Often the English translation was made to closely follow this. Many letters do not tag all names in the letter. Only suggest the addition of people tags if it is fairly clear who a name is referring too, as often untagged persons are mentioned only by first name.</p>
<table border="0" cellspacing="2" cellpadding="4">
 <tr style="font-size: 18px;">
  <td style="font-size: 18px;">Your Name: </td>
  <td><input type=text name="name"></td>
 </tr>
 <tr style="font-size: 18px;">
  <td style="font-size: 18px;">Your Email:</td><td><input type=text name="zaemail"></td>
 </tr>
 
 <tr>
	<td style="font-size: 18px;">Item:</td>
  <td style="font-family:courier; font-size: 16px;"><?php echo $title?></td>
  
 </tr>
 <tr>
  <td valign="top" style="font-size: 18px;">Message:</td>
  <td><textarea name="Message" cols="40" rows="8" style="font-size: 16px;"></textarea></td>
 </tr>
 <tr>
  <td colspan="2"><p  style="font-size: 18px;">Note: All fields are required. <br />
    <?php
    	require_once('../f/recaptchalib.php');
		$publickey = "6LdYDsASAAAAAB3s_9B75V7CRYtB4S8e2snx7z-8"; // you got this from the signup page
		echo recaptcha_get_html($publickey);
	?>
      <input type="submit" value="Send Email">
      <input type="reset">
      </p></td>
 </tr>
</table>

</form>
</body>
</html>