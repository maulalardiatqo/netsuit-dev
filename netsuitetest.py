import ctypes
import time

class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]

def get_idle_time():
    """Returns the idle time in seconds."""
    lii = LASTINPUTINFO()
    lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
    if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
        millis_since_last_input = ctypes.windll.kernel32.GetTickCount() - lii.dwTime
        return millis_since_last_input / 1000.0
    else:
        raise ctypes.WinError()

def move_mouse(x_offset=5, y_offset=5):
    """Moves the mouse cursor by a small offset."""
    ctypes.windll.user32.mouse_event(0x0001, x_offset, y_offset, 0, 0)  # MOUSEEVENTF_MOVE

if __name__ == "__main__":
    try:
        while True:
            idle_time = get_idle_time()
            print(f"Idle time: {idle_time:.2f} seconds")
            
            if idle_time >= 500:  # If idle for 3 seconds, move the mouse
                print("Mouse moved to prevent idle state.")
                move_mouse()
            
            time.sleep(1)  # Check every second
    except KeyboardInterrupt:
        print("\nExiting...")
