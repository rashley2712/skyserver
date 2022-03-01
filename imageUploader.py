#!/usr/bin/env python3
import argparse, os
import urllib.error
import urllib.request
from PIL import Image
import requests

def uploadToServer(imageFilename, URL):
        destinationURL = URL
        files = {'camera': open(imageFilename, 'rb')}
        try:
                response = requests.post(destinationURL, files=files)
                print("response code: " + str(response.status_code))
                response.close()
        except Exception as e:
                print("error: " + repr(e))
                return
        print("Uploaded image to %s\n"%destinationURL)
        return


if __name__ == "__main__":
	
	parser = argparse.ArgumentParser(description='Uploads an image to the skyWATCH server as a test.')
	parser.add_argument("-f",'--filename', type=str, help="Filename")
	parser.add_argument("-u", "--url", default="http://localhost:3000/upload", type=str, help="URL to upload to")
	args = parser.parse_args()


	print("Uploading file:", args.filename)

	im = Image.open(args.filename)
	# im.show()

	uploadToServer(args.filename, args.url)