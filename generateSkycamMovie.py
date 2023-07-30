#!/usr/bin/env python3

import argparse, os, subprocess, time
import sys
import datetime
import json

if __name__ == "__main__":
	
	parser = argparse.ArgumentParser(description='Makes the animation of the latest files for the AstroFarm skycam.')
	parser.add_argument('-c','--config', type=str, default="", help='The config file.')
	parser.add_argument('-p', '--imagePath', type=str, default=".", help="Path to the images.")
	parser.add_argument('-d', '--date', type=str, help="Compute for date YYYYMMDD, otherwise today. Day runs from 12:00 to 12:00 next day.")
	parser.add_argument('-l', '--latest', type=int, help="Build for the latest 'l' hours.")
	parser.add_argument('--device', type=str, default='none', help="Device to generate the movie for.")
	
	args = parser.parse_args()

	try: 
		configFile = open(args.config, 'rt')
		config = json.loads(configFile.read())
		print(config)
	except Exception as e:
		print("WARNING: No config file found")
		print(e)
		config = {}
		config['imagePath'] = args.imagePath
		config['timeZone'] = 0
	if args.imagePath != ".": config['imagePath'] = args.imagePath
	
	if args.date is not None:
		dateString = args.date
		timeString = args.date + "1200"
	else:
		now = datetime.datetime.now()
		timeString = now.strftime("%Y%m%d_%H%M")
		dateString = now.strftime("%Y%m%d")

	folder = config['imagePath']
	videoFolder = config['videoPath']

	# Generate the list of files in the specified folder
	fileCollection = []
	files = os.listdir(folder)
	for f in files:
		if "_small.jpg" in f:
			fileCollection.append(f)

	fileCollection = sorted(fileCollection)
	# Determine the start and end date for the video
	if args.latest is None:
		year = int(dateString[0:4])
		month = int(dateString[4:6])
		day = int(dateString[6:8])
		print("year:", year, "month", month, "day:", day)
		endTime = datetime.datetime(year=year, month=month, day=day, hour=12, minute=0, second=0)
		startTime = endTime + datetime.timedelta(days=-1)
	else:
		endTime = datetime.datetime.now()
		endTime = endTime + datetime.timedelta(hours=config['timeZone'])
		startTime = endTime - datetime.timedelta(hours=args.latest) 
	
	print("startTime:", startTime)
	print("endTime:", endTime)

	# Work out which files are eligible to be included in the video
	eligibleFiles = []
	for f in fileCollection:
		year = int(f[0:4])
		month = int(f[4:6])
		day = int(f[6:8])
		hour = int(f[9:11])
		minute = int(f[11:13])
		second = int(f[13:15])
		#print(f, "year:", year, "month", month, "day:", day, "hour:", hour, "minute:", minute, "second:", second)
		timeOfImage = datetime.datetime(year=year, month=month, day=day, hour=hour, minute=minute, second=second)
		if timeOfImage>startTime and timeOfImage<endTime:
			eligibleFiles.append(f)
	eligibleFiles = sorted(eligibleFiles)
	print(eligibleFiles)
	
	# Figure out lost of all hostnames
	deviceNames = []
	if args.device=="none":
		print("Unique device names")
		for e in eligibleFiles:
			deviceName = e.split('_')[2]
			if deviceName not in deviceNames: deviceNames.append(deviceName)
	else: deviceNames.append(args.device)
	print(deviceNames)
	
	for device in deviceNames: 
		import random
		randomNumber = random.randint(0, 99999)
		listFilename = "tmpVideo%05d.list"%randomNumber
		listFile = open(os.path.join(folder, listFilename), 'wt')
		fileList = []
		for f in eligibleFiles:
			if device in f: fileList.append(f)
		for f in fileList:
			listFile.write("%s\n"%f)
		listFile.close()

		if len(eligibleFiles)==0: 
			print("No files qualify for that date range. Exiting")
			sys.exit()
		
		listFilename = os.path.splitext(listFilename)[0]
		user = os.getlogin()
		ffmpegCommand = ["nice", "/home/%s/bin/pipeFFMPEG.bash"%user]
		ffmpegCommand.append(listFilename)
		print("Running:", ffmpegCommand)
		from subprocess import Popen, PIPE
		#output, errors = Popen(archiveFolder, stdout=PIPE, stderr=PIPE).communicate()
		os.chdir(folder)
		subprocess.call(ffmpegCommand)

		#
		# 
		#
		finalFilename = "%s_%s.mp4"%(device, dateString) 
		if args.latest is not None:
			finalFilename = "%s_%02d.mp4"%(device, args.latest)
		finalFilename = os.path.join(videoFolder, finalFilename)
		tmpMovie = os.path.join(folder, listFilename + ".mp4")
		print("Moving %s to %s"%(tmpMovie, finalFilename))
		os.rename(listFilename + ".mp4", finalFilename)
		print("Removing: %s.list"%listFilename)
		os.remove(listFilename + ".list")
		time.sleep(5)



	# Now generate an animated gif from the mp4
	# ffmpeg -i 20200622.mp4 -filter_complex "[0:v] split [a][b];[a] palettegen [p];[b][p] paletteuse" out.gif
	# only do a gif for the 'latest' movies
	# edit ... don't do a gif at all.
	if not True:
		ffmpegCommand = ['ffmpeg']
		ffmpegCommand.append('-y')
		ffmpegCommand.append('-i')
		ffmpegCommand.append(listFilename + ".mp4")
		ffmpegCommand.append('-filter_complex')
		ffmpegCommand.append('[0:v] split [a][b];[a] palettegen [p];[b][p] paletteuse')
		ffmpegCommand.append(listFilename + '.gif')
		print(ffmpegCommand)
		subprocess.call(ffmpegCommand)

