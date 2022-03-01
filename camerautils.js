
const fs = require('fs');
const path = require('path');
const  spawn  = require('child_process');


function updateImageFilelist(folderPath) {
	// Scans the skycam folder to re-generate the JSON list of skycam images
	if (folderPath==null) folderPath = '/var/www/skyserver/camera';
  
  	const JSONFilename = 'skycam.json';
  	var originalFileList = [];
	var smallFileList = [];
    const fullImageRegEx = /^[0-9]{8}_[0-9]{6}_[a-z]*.jpg/
	
  	// Look for the original files
  	let originalPath = path.join(folderPath, "/original/");

  	var files = fs.readdirSync(originalPath);
    
	for (file of files) {
	  let found = file.match(fullImageRegEx);
	  if (found) originalFileList.push(file);
	}

	var uniqueHostnames = [];
	for (f of originalFileList) {
		let newname = f.split('_')[2].split('.')[0];
		if (!uniqueHostnames.includes(newname)) uniqueHostnames.push(newname);
	}
	console.log("unique hosts:", uniqueHostnames);
	
	const smallImageRegEx = /^[0-9]{8}_[0-9]{6}_[a-z]*_small.jpg/ 
	let smallPath = path.join(folderPath, "/small/");
	var files = fs.readdirSync(smallPath)
    
	for (file of files) {
	  let found = file.match(smallImageRegEx);
	  if (found) smallFileList.push(file);
	}
	
    var skycamData = {};
	skycamData.hostnames = uniqueHostnames;
    var availableDates = [];
    for (file of originalFileList) {
      let datePortion = file.substring(0, 8);
      if (!availableDates.includes(datePortion)) availableDates.push(datePortion);
    }
	skycamData.dates = availableDates;
    
	originalFileList.sort();
    originalFileList.reverse();
	smallFileList.sort();
    smallFileList.reverse();
	
	for (host of uniqueHostnames) {
		var fileList = [];
		for (o of originalFileList) {
			if (o.includes(host)) fileList.push(o);
		}
		skycamData[host] = {}
		skycamData[host].original = fileList;
		fileList = [];
		for (o of smallFileList) {
			if (o.includes(host)) fileList.push(o);
		}
		skycamData[host].small = fileList;
		skycamData[host].mostRecent = fileList[0];
	}
    
    console.log("all dates:", availableDates);
    fileJSON = JSON.stringify(skycamData, null, 2);
    fs.writeFile(path.join(folderPath, JSONFilename), fileJSON, function (err) {
      if (err) return console.log(err);
      console.log('Updated', JSONFilename);
    });

}

function scaleFile(filename, cameraPath) {
	console.log("going to rescale the file:", filename);
	if(filename.includes("small")) {
	
		console.log("Filename already contains keyword 'small'");
		let thumbnailToPath = path.parse(filename).dir + "/small/" + path.parse(filename).base;
		console.log("moving small upload from %s to %s", filename, thumbnailToPath);
		fs.renameSync(filename, thumbnailToPath);
	
		return filename;
	}
	output = filename.split('.')[0] + "_small." + filename.split('.')[1];
	console.log("output will be:", output);
	console.log("convert", filename, '-resize', '1014', output);
	const resize = spawn.spawnSync('convert', [filename, '-resize', '1014', output]);

	console.log("convert output is:", resize.stdout);
	console.log("conversion successful!");
	let originalToPath = path.parse(filename).dir + "/original/" + path.parse(filename).base;
	console.log("moving original %s to %s", filename, originalToPath);
	let thumbnailToPath = path.parse(output).dir + "/small/" + path.parse(output).base;
	console.log("moving thumbnail %s to %s", output, thumbnailToPath);
	fs.renameSync(filename, originalToPath);
	fs.renameSync(output, thumbnailToPath);
	updateImageFilelist(cameraPath);
	return output;
}


module.exports.updateImageFilelist = updateImageFilelist;
module.exports.scaleFile = scaleFile;