import sys
import time
import socket

TIMEOUT = 30

class Firefly:
    def __init__(self, port):
        self._port = port

    def _get_the_dataz(self, s):
        ret = ""
        s.settimeout(TIMEOUT)
        while True:
            data = s.recv(4096)
            if not data:
                break
            ret = ret + data;
        return ret

    def _send_command(self, command, retries=3):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            #s.connect(('127.0.0.1', self._port))
            s.connect(('localhost', self._port))
            s.send(command)
            ret = self._get_the_dataz(s)
            s.close()
            return ret
        except socket.error as ex:
            print "Firefly timeout, %d retries left" % retries
            print str(ex)

            if retries == 0:
                print "Can't reach firefly on port %d!" % self._port
                raise
            retries -= 1
            time.sleep([30, 10, 2][retries])
            return self._send_command(command, retries)
    
    def get_visual_elements(self, url):
        return self._send_command('GOTO %s' % url)


################
## DEBUG CODE ##
################

if __name__ == '__main__':

    import firefox_startup

    if len(sys.argv) < 4:
        print "usage: %s profile port website" % argv[1]

    print sys.argv
    profile = sys.argv[1]
    port = int(sys.argv[2])
    website = sys.argv[3]

    firefox_startup.startup_firefox(profile)
    print Firefly(port).get_visual_elements(website)
