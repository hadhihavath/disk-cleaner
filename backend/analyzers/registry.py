import winreg
from datetime import datetime

def get_installed_software():
    installed_apps = []
    
    # Registry hives and subkeys to search
    registry_targets = [
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", winreg.KEY_READ | winreg.KEY_WOW64_64KEY),
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", winreg.KEY_READ | winreg.KEY_WOW64_32KEY),
        (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall", winreg.KEY_READ)
    ]
    
    seen_names = set() # Avoid duplicates across hives
    
    for hive, path, access_flag in registry_targets:
        try:
            key = winreg.OpenKey(hive, path, 0, access_flag)
        except WindowsError:
            continue
            
        try:
            num_subkeys = winreg.QueryInfoKey(key)[0]
        except WindowsError:
            winreg.CloseKey(key)
            continue
            
        for i in range(num_subkeys):
            try:
                subkey_name = winreg.EnumKey(key, i)
                subkey = winreg.OpenKey(key, subkey_name, 0, access_flag)
            except WindowsError:
                continue
                
            try:
                # Helper to read optional keys
                def get_val(val_name):
                    try:
                        return winreg.QueryValueEx(subkey, val_name)[0]
                    except WindowsError:
                        return None
                
                name = get_val("DisplayName")
                if not name or not str(name).strip():
                    winreg.CloseKey(subkey)
                    continue
                    
                name = str(name).strip()
                if name in seen_names:
                    winreg.CloseKey(subkey)
                    continue
                    
                seen_names.add(name)
                
                publisher = get_val("Publisher") or "Unknown"
                version = get_val("DisplayVersion") or "Unknown"
                uninstall_string = get_val("UninstallString") or ""
                
                # Try parsing InstallDate (usually YYYYMMDD, but can be other formats or missing)
                install_date_raw = get_val("InstallDate")
                install_date = "Unknown"
                if install_date_raw:
                    try:
                        install_date_str = str(install_date_raw).strip()
                        if len(install_date_str) == 8 and install_date_str.isdigit():
                            # Format YYYYMMDD
                            install_date = f"{install_date_str[:4]}-{install_date_str[4:6]}-{install_date_str[6:]}"
                        else:
                            install_date = install_date_str
                    except Exception:
                        pass
                
                # Estimated size in KB
                size_kb = get_val("EstimatedSize")
                size_bytes = 0
                if size_kb is not None:
                    try:
                        size_bytes = int(size_kb) * 1024
                    except (ValueError, TypeError):
                        pass
                
                installed_apps.append({
                    "name": name,
                    "publisher": str(publisher),
                    "version": str(version),
                    "install_date": install_date,
                    "size": size_bytes,
                    "uninstall_string": str(uninstall_string)
                })
                
            except Exception:
                pass
            finally:
                try:
                    winreg.CloseKey(subkey)
                except WindowsError:
                    pass
                    
        winreg.CloseKey(key)
        
    return installed_apps
