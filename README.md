# adscape
Crawler code and ad detection algorithm


Crawler Deployment
Aaron Cahn
9/28/15

OS:		Ubuntu 14.04
Browser:	Firefox version 41.0
Python:			Python 2.7
Status:			       Success

Installed Packages (commands to setup environment):
	  $> sudo apt-get install firefox, python-pip, python-dev, build-essential, xvfb, emacs
	  $> sudo pip install pyvirtualdisplay
	  $> git clone https://github.com/ACAHNN/adscape.git
Code Base:
     cube.py (main logic loop)
     adblock.py (ad detection algorithm)
     firefly.py (communicates with the extension)
     firefox_startup.py (starts a firefox instance)
     profile_setup.py (registers a firefox profile)
     firefly/ (directory containing the extension)
     filters/ (directory containing adblock filters)

Usage Steps:
run profile_setup.py to create a firefox profile (give it the required arguments (profile name, and port number to run the server socket on)
modify cube.py as need to read in the set of sites you want to visit (from a db, or a file, or wherever)
modify cube.py to save the data returned from the extension (save to a db, a file, or wherever)
run cube.py to iterate over the sites you want to scrape visual elements from
modify adblock.py to be as strict or lenient as desired when detecting ads (we tended on the strict side, low false positive rate)
run adblock.py to detect which visual elements returned from cube.py are in fact ads

** NOTE: The extension is a bit outdated now, it might require a little bit of hacking to get running given your particular setup, but if you have knowledge of python and javascript this won’t be difficult. Otherwise the ad detection code is separate from the collection code. Using an automation tool like Selenium might ease your efforts. cube.py is very barebones. (I in fact switched to Selenium as the crawling infrastructure grew in complexity and I wanted more administration and monitoring capabilities for my research. Selenium is very easy to get running).