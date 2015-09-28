import os
import sys
import time

STANDARD_SIZES = set(((250, 250), (300, 1050), (160, 600), (728, 90), 
        (300, 600), (970, 90), (234, 60), (125, 125), (300, 250), 
        (120, 240), (120, 90), (180, 160), (300, 100), (970, 250), 
        (120, 60), (550, 480), (468, 60), (336, 280), (88, 31), 
        (240, 400), (180, 150), (120, 600), (720, 300), (976, 40),
        (180, 900)))

def filter(list, s):
    for x in list:
        if x in s:
            return True
    return False

###################################################
## TWEAK THE ARGUMENTS TO THIS AS NEEDED         ##
## (we loaded from a db, hence the id attribute) ##
## (change the ad detection code as desired too) ##
###################################################

def is_it_an_ad(list, id, src, iframe_url, width, height, landing_url, landing_domain, parent_domain):
    if (width, height) not in STANDARD_SIZES:
        return False
    if landing_domain == parent_domain:
        return False
    # no ads with no landing pages
    if len(landing_url) == 0:
        return False
    # check against adblock filters
    if filter(list, img[0]) or filter(list, img[1]):
        return True
    return False

if __name__ == '__main__':

    # usage: python adblock.py filter list
    if len(sys.argv) < 1:
        print "usage: python adblock.py filter_list"
        sys.exit(1)


    # loads an adblock filter list (used the simple text file)
    list = open(sys.argv[1]).read().split('\n')[:-1]

    ##########################################################
    ## OPEN THE FILE OR DB CONTAINING YOUR SAVED CRAWL DATA ##
    ##########################################################
    
    # data = (load in crawl data)
    
    ## THIS IS AN EXAMPLE ##
    data = [['www.example.com/article1',
             'ads.example.com/&ad_channel=2829',
             250,
             250,
             'www.amazon.com',
             'amazon.com',
             'example.com']]
                
    ads, non_ads = [],[]
    for img in data:
        src, iframe_url, width, height, landing_url, landing_domain, parent_domain = img
        if is_it_an_ad(list, id, src, iframe_url, width, height, landing_url, landing_domain, parent_domain):
            ads.append(img[0])
        else:
            non_ads.append(img[0])
    print ads
    print non_ads
    # (save ads, non_ads as desired)

    ## END OF THE EXAMPLE ##
