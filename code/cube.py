import os
import sys
import time
import json
import socket
import urlparse
import datetime
import firefly
import firefox_startup

from pyvirtualdisplay import Display

if __name__ == '__main__':

    # quick argument sanity check
    if len(sys.argv) < 3:
        print 'usage: %s profile_name port' % sys.argv[0]
        sys.exit(1)

    # grab the command line args
    profile_name = sys.argv[1]
    profile_port = int(sys.argv[2])

    # turn on headless environment
    #vd = Display(visible=0, size=(640,480))
    #vd.start()

    # open a browsing window
    firefox_startup.startup_firefox(sys.argv[1])

    # getting all the classes we need
    firefly = firefly.Firefly(profile_port)

    ##############################################
    ##                                          ##
    ## Sample crawl (add desired functionality) ##
    ##                                          ##
    ##############################################    

    urls = ['www.google.com',
            'www.nytimes.com',
            'www.yahoo.com']

    errors = 0
    for url in urls:
        # collection receiving consecutive errors
        if errors > 2:
            print "3 Errors in a row. Terminating..."
            break

        try:
            # navigate to the next collection site
            print "Navigating to %s"%url

            # collect the visual elements (will get images as well)
            visual_elements = firefly.get_visual_elements(url)
            visual_elements = visual_elements.decode('ascii', 'ignore')

        except socket.timeout as ex:
            print "Timeout connecting to %s...moving on."%url
            errors += 1
            continue


        # dump the data to stdout
        # materialize as needed (file, database, whatever...)
        print visual_elements

        # reset consecutive error counter
        errors = 0
