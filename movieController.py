#!/usr/bin/env python3

import argparse, os, subprocess, time, logging, random
import sys
import datetime
import json

def information(message):
	global log
	if service: log.info(message)
	else: 
		print(message, flush=True)
	return

def error(message):
	global log
	if service: log.error(message)
	else: 
		print("Error: " + message, flush=True)
	return


class movie:
	def __init__(self, name):
		self.name = name
		self.fileList = []
		self.newFileCount = 0
		self.metadata = { "device" : self.name }
		self.timeZone = 0
		self.outputPath = "/var/www/skyserver/camera/videos"
		self.lastCheckTime = None
		self.readMetadata()
		self.rawFileList = []
		self.videoList = [ 
			{"description" : "4 hours", "hours": 4, "numNewImages" : 2 },
			{"description" : "8 hours", "hours": 8, "numNewImages" : 7 },
			{"description" : "12 hours", "hours": 12, "numNewImages" : 20 },
			{"description" : "24 hours", "hours": 24, "numNewImages" : 35 }
		]
		
	def defineVideoRequirements(self, videoRequirements):
		self.videoList = videoRequirements


	def numFilesSince(self):
		for hourInfo in self.videoList:
			hours = hourInfo['hours']
			lastCheck = datetime.datetime.now()
			
			try:
				self.metadata[hourInfo['description']]['lastCheck'] = str(lastCheck)
			except KeyError:
				self.metadata[hourInfo['description']] = {}
				self.metadata[hourInfo['description']]['lastCheck'] = str(lastCheck)
			
			try:
				lastVideoFrameTime = datetime.datetime.strptime(self.metadata[hourInfo['description']]['lastFile'][0:15], '%Y%m%d_%H%M%S')
				newFiles = []
				for f in self.rawFileList:
					year = int(f[0:4])
					month = int(f[4:6])
					day = int(f[6:8])
					hour = int(f[9:11])
					minute = int(f[11:13])
					second = int(f[13:15])
					timeOfImage = datetime.datetime(year=year, month=month, day=day, hour=hour, minute=minute, second=second)
					if timeOfImage>lastVideoFrameTime:
						newFiles.append(f)
				self.newFiles = newFiles
			except KeyError as e:
				error("Exception:" +  str(e))
				self.newFiles = self.rawFileList
			
			information("%s %s %d files newer"%(self.name, hourInfo['description'], len(self.newFiles)))
			if len(self.newFiles)>=hourInfo['numNewImages']: 
				self.makeMovie(hourInfo)
			else:
				self.writeMetadata()
	
	def readMetadata(self):
		try:
			metadataFile = open(os.path.join(self.outputPath, self.name + ".json"), "rt")
			self.metadata = json.load(metadataFile)
			metadataFile.close()
		except Exception as e:
			error("Unable to read metadata file for " + self.name)

	def writeMetadata(self):
		try:
			metadataFile = open(os.path.join(self.outputPath, self.name + ".json"), "wt")
			json.dump(self.metadata, metadataFile, indent=4)
			metadataFile.close()
		except Exception as e:
			error("Unable to write metadata file for " + self.name)
			print(e)

	def makeMovie(self, hourInfo):
		randomNumber = random.randint(0, 99999)
		fileList = self.getFilesByHour(hourInfo['hours'])
		listFilename = "tmpVideo%05d_%s.list"%(randomNumber, m.name)
		listFile = open(os.path.join(folder, listFilename), 'wt')
		for f in fileList:
			listFile.write("%s\n"%f)
		listFile.close()
		listFileMain = os.path.splitext(listFilename)[0]
		try: 
			user = os.getlogin()
		except: 
			user = 'bitnami'
		ffmpegCommand = ["nice", "/home/%s/bin/pipeFFMPEG.bash"%user]
		ffmpegCommand.append(listFileMain)
		if len(fileList)<2:
			error("Less than 2 images in this movie. ...skipping...")
			return
		information("%d images in this movie"%len(fileList))
		information("Running:" + str(ffmpegCommand))
		os.chdir(folder)
		videolog = open("/tmp/videout.log", 'wt')
		subprocess.call(ffmpegCommand, stdout=videolog, stderr=videolog)
		videolog.close()
		time.sleep(2)
		finalFilename = "%s_%02d.mp4"%(m.name, hourInfo['hours']) 
		finalFilename = os.path.join(videoFolder, finalFilename)
		tmpMovie = os.path.join(folder, listFilename + ".mp4")
		print("Moving %s to %s"%(tmpMovie, finalFilename))
		os.rename(listFileMain + ".mp4", finalFilename)
		print("Removing: %s"%listFilename)
		os.remove(listFilename)
		self.metadata[hourInfo['description']] =  {}
		self.metadata[hourInfo['description']]['firstFile'] = fileList[0]
		self.metadata[hourInfo['description']]['lastFile'] = fileList[-1]
		self.metadata[hourInfo['description']]['lastCheck'] = str(self.lastCheckTime)
		self.metadata[hourInfo['description']]['numFiles'] = len(fileList)
		m.writeMetadata()
		time.sleep(2)


	def getFilesByHour(self, hours):
		endTime = datetime.datetime.now()
		endTime = endTime + datetime.timedelta(self.timeZone)
		startTime = endTime - datetime.timedelta(hours=hours) 
	
		information("\tstartTime:\t" + str(startTime))
		information("\tendTime:\t" + str(endTime))
		self.lastCheckTime = endTime
		return m.getFilesFor(startTime, endTime)

	def getFilesFor(self, startTime, endTime):
		eligibleFiles = []
		for f in self.rawFileList:
			year = int(f[0:4])
			month = int(f[4:6])
			day = int(f[6:8])
			hour = int(f[9:11])
			minute = int(f[11:13])
			second = int(f[13:15])
			timeOfImage = datetime.datetime(year=year, month=month, day=day, hour=hour, minute=minute, second=second)
			if timeOfImage>startTime and timeOfImage<endTime:
				eligibleFiles.append(f)
		eligibleFiles = sorted(eligibleFiles)
		return eligibleFiles
	

if __name__ == "__main__":
	parser = argparse.ArgumentParser(description='Service to manage the creation of the mp4 animations from skyWATCH skyCam.')
	parser.add_argument('-c','--config', type=str, default="", help='The config file.')	
	parser.add_argument('-s', '--service', action="store_true", default=False, help='Specify this option if running as a service.' )

	args = parser.parse_args()
	service = args.service

	if service:
		log = logging.getLogger('movie.service')
		log.setLevel(logging.INFO)
		information("Starting the movie.service system daemon.")

	while True:
			
		try: 
			configFile = open(args.config, 'rt')
			config = json.loads(configFile.read())
		except Exception as e:
			print("WARNING: No config file found")
			print(e)
			sys.exit()

		folder = config['imagePath']
		videoFolder = config['videoPath']

		
		# Generate the list of all files in the specified folder
		fileCollection = []
		files = os.listdir(folder)
		for f in files:
			if "_small.jpg" in f:
				fileCollection.append(f)

		fileCollection = sorted(fileCollection)


		# Figure out list of all hostnames
		deviceNames = []
		for f in fileCollection:
			deviceName = f.split('_')[2]
			if deviceName not in deviceNames: deviceNames.append(deviceName)
		information("Unique device names: " + str(deviceNames))
		
		movies = []
		for d in deviceNames:
			movieInstance = movie(d)
			newFileList = []
			for f in fileCollection:
				if d in f: newFileList.append(f)
			movieInstance.rawFileList = newFileList
			if config['videoRequirements']!=None: movieInstance.defineVideoRequirements(config['videoRequirements'])
			movies.append(movieInstance)


		# Start making movies	
		for index, m in enumerate(movies):
			# if m.name != 'feelgood': continue
			m.numFilesSince()
	
		information("Sleeping for %d seconds"%config['videoCadence'])
		time.sleep(config['videoCadence'])	
	