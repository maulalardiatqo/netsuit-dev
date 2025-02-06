import ctypes
import time

class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]  # Tetap gunakan c_uint

def get_idle_time():
    """Returns the idle time in seconds with wrap-around handling."""
    lii = LASTINPUTINFO()
    lii.cbSize = ctypes.sizeof(LASTINPUTINFO)

    if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
        tick_count = ctypes.windll.kernel32.GetTickCount()  # Pakai 32-bit GetTickCount()
        last_input = lii.dwTime  # Ini juga 32-bit

        if tick_count < last_input:  # Jika terjadi overflow (wrap-around)
            millis_since_last_input = (tick_count + (2**32)) - last_input
        else:
            millis_since_last_input = tick_count - last_input

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

            if idle_time >= 3:  # Jika idle lebih dari atau sama dengan 3 detik, gerakkan mouse
                print("Mouse moved to prevent idle state.")
                move_mouse()

            time.sleep(1)  # Cek setiap 1 detik
    except KeyboardInterrupt:
        print("\nExiting...")
