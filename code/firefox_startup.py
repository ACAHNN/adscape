import time
import atexit
import subprocess

def kill_process(pid):
    subprocess.call('kill -9 %s' % pid, shell=True)

def startup_firefox(profile, kill_firefox=True):

    # start firefox
    dev_null = open('/dev/null', 'w')
    p = subprocess.Popen(['/usr/bin/firefox', '-no-remote', '-P', profile], 
                         stdout=dev_null,
                         stderr=dev_null)

    #p = subprocess.Popen(['/opt/firefox37/firefox', '-no-remote', '-P', profile], 
    #                     stdout=dev_null,
    #                     stderr=dev_null)


    # breathe
    time.sleep(15)

    if kill_firefox:
        atexit.register(kill_process, p.pid)
    return p.pid

################
## DEBUG CODE ##
################

if __name__ == '__main__':
    print startup_firefox('default')
    time.sleep(30)
