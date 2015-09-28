import subprocess
import sys
import time
import os
from pyvirtualdisplay import Display

PATH_TO_EXTENSION = os.getcwd() + '/firefly/'
PATH_TO_FIREFOX_PREFS = '~/.mozilla/firefox'

class CalledProcessError(Exception):
    def __init__(self, returncode, cmd, output=None):
        self.returncode = returncode
        self.cmd = cmd
        self.output = output
    def __str__(self):
        return "Command '%s' returned non-zero exit status %d" % (
            self.cmd, self.returncode)

# c/p from check_output implementation
def check_output(*popenargs, **kwargs):
    if 'stdout' in kwargs:
        raise ValueError('stdout argument not allowed, it will be overridden.')
    process = subprocess.Popen(stdout=subprocess.PIPE, *popenargs, **kwargs)
    output, unused_err = process.communicate()
    retcode = process.poll()
    if retcode:
        cmd = kwargs.get("args")
        if cmd is None:
            cmd = popenargs[0]
        raise CalledProcessError(retcode, cmd, output=output)
    return output

def firefox_profile_exists(name):
    output = check_output('ls %s' % PATH_TO_FIREFOX_PREFS, shell=True).split('\n')[:-1]
    return any(map(lambda x: (x.split('.')[1] == name), output))

def create_profile(name):
    output = check_output('/usr/bin/firefox -CreateProfile %s' % name, shell=True, stderr = subprocess.STDOUT)
    path_to_profile = output.split('\'')[-2]
    path_to_profile = '/'.join(path_to_profile.split('/')[:-1])
    return path_to_profile

def firefox_profile_install_firefly(path_to_profile, port):
    subprocess.call('mkdir %s/extensions/ 2> /dev/null' % path_to_profile, shell=True)
    subprocess.call('ln -s %s %s/extensions/firefly@ad.spider' % (PATH_TO_EXTENSION, path_to_profile), shell=True)
    prefs = open("%s/prefs.js" % path_to_profile, "a")
    prefs.write('user_pref("firefly.port", %s);\n' % port)
    prefs.close()

def firefox_profile_remove(full_path):
    subprocess.call("rm -rf %s > /dev/null 2>&1" % full_path, shell=True)

def setup_firefox_profile(name, port):
    path_to_profile = create_profile(name)
    firefox_profile_install_firefly(path_to_profile, port)


if __name__ == '__main__':
    vd = Display(visible=0, size=(640,480))
    vd.start()

    if len(sys.argv) < 3:
        print 'usage: %s profile_name port' % sys.argv[0]
        sys.exit(1)

    setup_firefox_profile(sys.argv[1], sys.argv[2])

