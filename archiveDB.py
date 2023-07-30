#!/usr/bin/env python3
import sqlite3
import argparse, os


if __name__ == "__main__":
	parser = argparse.ArgumentParser(description='Opens the database files and creates an archive for each.')
	args = parser.parse_args()
	
	databases = ['meteo', 'images', 'status']

	for database in databases:
		# Open the sql database
		connection = sqlite3.connect('www/%s.db'%database)
		print("Opened database: www/%s.db"%database)

		# Get all available dates
		SQLstring = "SELECT DISTINCT(substr(date, 0, 11)) AS availableDate FROM %s;"%database
		try:
			cursor = connection.cursor()	
			cursor.execute(SQLstring)
			rows = cursor.fetchall()
		except sqlite3.OperationalError as e:
			print(e)

		allDates = []
		allMonths = []
		for row in rows:
			allDates.append(row[0])
		for date in allDates:
			monthStr= date[:7]
			if monthStr not in allMonths: allMonths.append(monthStr)
		
		# Leave the current month off
		allMonths = allMonths[:-1]
		print("Months to archive: ", allMonths)
		for month in allMonths:
			# Create a table for each month
			SQLstring = "create table monthly_" + month.replace('-', '_') + " as select * from " + database + " where substr(date, 0, 8) = '" + month + "';"
			try:
				cursor = connection.cursor()	
				cursor.execute(SQLstring)
			except sqlite3.OperationalError as e:
				print(e)
			print("Executed '" + SQLstring + "'")

			# Now clean out data from current table
			SQLstring = "delete from " + database + " where substr(date, 0, 8) = '" + month + "';"
			try:
				cursor = connection.cursor()	
				cursor.execute(SQLstring)
				connection.commit()
			except sqlite3.OperationalError as e:
				print(e)
			print("Executed '" + SQLstring + "'")
		connection.close()
		print("closed database....")
	