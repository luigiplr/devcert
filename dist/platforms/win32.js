"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const debug_1 = tslib_1.__importDefault(require("debug"));
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const fs_1 = require("fs");
const shared_1 = require("./shared");
const utils_1 = require("../utils");
const user_interface_1 = tslib_1.__importDefault(require("../user-interface"));
const debug = debug_1.default('devcert:platforms:windows');
let encryptionKey;
class WindowsPlatform {
    constructor() {
        this.HOST_FILE_PATH = 'C:\\Windows\\System32\\Drivers\\etc\\hosts';
    }
    /**
     * Windows is at least simple. Like macOS, most applications will delegate to
     * the system trust store, which is updated with the confusingly named
     * `certutil` exe (not the same as the NSS/Mozilla certutil). Firefox does it's
     * own thing as usual, and getting a copy of NSS certutil onto the Windows
     * machine to try updating the Firefox store is basically a nightmare, so we
     * don't even try it - we just bail out to the GUI.
     */
    addToTrustStores(certificatePath, options = {}) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            // IE, Chrome, system utils
            debug('adding devcert root to Windows OS trust store');
            try {
                utils_1.run(`certutil -addstore -user root ${certificatePath}`);
            }
            catch (e) {
                e.output.map((buffer) => {
                    if (buffer) {
                        console.log(buffer.toString());
                    }
                });
            }
            debug('adding devcert root to Firefox trust store');
            // Firefox (don't even try NSS certutil, no easy install for Windows)
            try {
                yield shared_1.openCertificateInFirefox('start firefox', certificatePath);
            }
            catch (_a) {
                // Ignore exception, most likely Firefox doesn't exist.
            }
        });
    }
    addDomainToHostFileIfMissing(domain) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let hostsFileContents = fs_1.readFileSync(this.HOST_FILE_PATH, 'utf8');
            if (!hostsFileContents.includes(domain)) {
                yield utils_1.sudo(`echo 127.0.0.1  ${domain} >> ${this.HOST_FILE_PATH}`);
            }
        });
    }
    readProtectedFile(filepath) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!encryptionKey) {
                encryptionKey = yield user_interface_1.default.getWindowsEncryptionPassword();
            }
            // Try to decrypt the file
            try {
                return this.decrypt(fs_1.readFileSync(filepath, 'utf8'), encryptionKey);
            }
            catch (e) {
                // If it's a bad password, clear the cached copy and retry
                if (e.message.indexOf('bad decrypt') >= -1) {
                    encryptionKey = null;
                    return yield this.readProtectedFile(filepath);
                }
                throw e;
            }
        });
    }
    writeProtectedFile(filepath, contents) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!encryptionKey) {
                encryptionKey = yield user_interface_1.default.getWindowsEncryptionPassword();
            }
            let encryptedContents = this.encrypt(contents, encryptionKey);
            fs_1.writeFileSync(filepath, encryptedContents);
        });
    }
    encrypt(text, key) {
        let cipher = crypto_1.default.createCipher('aes256', new Buffer(key));
        return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
    }
    decrypt(encrypted, key) {
        let decipher = crypto_1.default.createDecipher('aes256', new Buffer(key));
        return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
    }
}
exports.default = WindowsPlatform;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2luMzIuanMiLCJzb3VyY2VSb290IjoiQzovU291cmNlL2RldmNlcnQvIiwic291cmNlcyI6WyJwbGF0Zm9ybXMvd2luMzIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMERBQWdDO0FBQ2hDLDREQUE0QjtBQUM1QiwyQkFBa0U7QUFFbEUscUNBQW9EO0FBRXBELG9DQUFxQztBQUNyQywrRUFBbUM7QUFFbkMsTUFBTSxLQUFLLEdBQUcsZUFBVyxDQUFDLDJCQUEyQixDQUFDLENBQUM7QUFFdkQsSUFBSSxhQUFxQixDQUFDO0FBRTFCO0lBQUE7UUFFVSxtQkFBYyxHQUFHLDRDQUE0QyxDQUFDO0lBeUV4RSxDQUFDO0lBdkVDOzs7Ozs7O09BT0c7SUFDRyxnQkFBZ0IsQ0FBQyxlQUF1QixFQUFFLFVBQW1CLEVBQUU7O1lBQ25FLDJCQUEyQjtZQUMzQixLQUFLLENBQUMsK0NBQStDLENBQUMsQ0FBQTtZQUN0RCxJQUFJLENBQUM7Z0JBQ0gsV0FBRyxDQUFDLGlDQUFrQyxlQUFnQixFQUFFLENBQUMsQ0FBQztZQUM1RCxDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDWCxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQWMsRUFBRSxFQUFFO29CQUM5QixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO3dCQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQ2pDLENBQUM7Z0JBQ0gsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1lBQ0QsS0FBSyxDQUFDLDRDQUE0QyxDQUFDLENBQUE7WUFDbkQscUVBQXFFO1lBQ3JFLElBQUksQ0FBQztnQkFDSCxNQUFNLGlDQUF3QixDQUFDLGVBQWUsRUFBRSxlQUFlLENBQUMsQ0FBQztZQUNuRSxDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsSUFBRCxDQUFDO2dCQUNQLHVEQUF1RDtZQUN6RCxDQUFDO1FBQ0gsQ0FBQztLQUFBO0lBRUssNEJBQTRCLENBQUMsTUFBYzs7WUFDL0MsSUFBSSxpQkFBaUIsR0FBRyxpQkFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDMUQsRUFBRSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QyxNQUFNLFlBQUksQ0FBQyxtQkFBb0IsTUFBTyxPQUFRLElBQUksQ0FBQyxjQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQ3hFLENBQUM7UUFDSCxDQUFDO0tBQUE7SUFFSyxpQkFBaUIsQ0FBQyxRQUFnQjs7WUFDdEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUNuQixhQUFhLEdBQUcsTUFBTSx3QkFBRSxDQUFDLDRCQUE0QixFQUFFLENBQUM7WUFDMUQsQ0FBQztZQUNELDBCQUEwQjtZQUMxQixJQUFJLENBQUM7Z0JBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7WUFDN0QsQ0FBQztZQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1gsMERBQTBEO2dCQUMxRCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzNDLGFBQWEsR0FBRyxJQUFJLENBQUM7b0JBQ3JCLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDaEQsQ0FBQztnQkFDRCxNQUFNLENBQUMsQ0FBQztZQUNWLENBQUM7UUFDSCxDQUFDO0tBQUE7SUFFSyxrQkFBa0IsQ0FBQyxRQUFnQixFQUFFLFFBQWdCOztZQUN6RCxFQUFFLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLGFBQWEsR0FBRyxNQUFNLHdCQUFFLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztZQUMxRCxDQUFDO1lBQ0QsSUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQztZQUM5RCxrQkFBSyxDQUFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7S0FBQTtJQUVPLE9BQU8sQ0FBQyxJQUFZLEVBQUUsR0FBVztRQUN2QyxJQUFJLE1BQU0sR0FBRyxnQkFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM1RCxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVPLE9BQU8sQ0FBQyxTQUFpQixFQUFFLEdBQVc7UUFDNUMsSUFBSSxRQUFRLEdBQUcsZ0JBQU0sQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLElBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDaEUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVFLENBQUM7Q0FFRjtBQTNFRCxrQ0EyRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY3JlYXRlRGVidWcgZnJvbSAnZGVidWcnO1xyXG5pbXBvcnQgY3J5cHRvIGZyb20gJ2NyeXB0byc7XHJcbmltcG9ydCB7IHdyaXRlRmlsZVN5bmMgYXMgd3JpdGUsIHJlYWRGaWxlU3luYyBhcyByZWFkIH0gZnJvbSAnZnMnO1xyXG5pbXBvcnQgeyBPcHRpb25zIH0gZnJvbSAnLi4vaW5kZXgnO1xyXG5pbXBvcnQgeyBvcGVuQ2VydGlmaWNhdGVJbkZpcmVmb3ggfSBmcm9tICcuL3NoYXJlZCc7XHJcbmltcG9ydCB7IFBsYXRmb3JtIH0gZnJvbSAnLic7XHJcbmltcG9ydCB7IHJ1biwgc3VkbyB9IGZyb20gJy4uL3V0aWxzJztcclxuaW1wb3J0IFVJIGZyb20gJy4uL3VzZXItaW50ZXJmYWNlJztcclxuXHJcbmNvbnN0IGRlYnVnID0gY3JlYXRlRGVidWcoJ2RldmNlcnQ6cGxhdGZvcm1zOndpbmRvd3MnKTtcclxuXHJcbmxldCBlbmNyeXB0aW9uS2V5OiBzdHJpbmc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBXaW5kb3dzUGxhdGZvcm0gaW1wbGVtZW50cyBQbGF0Zm9ybSB7XHJcblxyXG4gIHByaXZhdGUgSE9TVF9GSUxFX1BBVEggPSAnQzpcXFxcV2luZG93c1xcXFxTeXN0ZW0zMlxcXFxEcml2ZXJzXFxcXGV0Y1xcXFxob3N0cyc7XHJcblxyXG4gIC8qKlxyXG4gICAqIFdpbmRvd3MgaXMgYXQgbGVhc3Qgc2ltcGxlLiBMaWtlIG1hY09TLCBtb3N0IGFwcGxpY2F0aW9ucyB3aWxsIGRlbGVnYXRlIHRvXHJcbiAgICogdGhlIHN5c3RlbSB0cnVzdCBzdG9yZSwgd2hpY2ggaXMgdXBkYXRlZCB3aXRoIHRoZSBjb25mdXNpbmdseSBuYW1lZFxyXG4gICAqIGBjZXJ0dXRpbGAgZXhlIChub3QgdGhlIHNhbWUgYXMgdGhlIE5TUy9Nb3ppbGxhIGNlcnR1dGlsKS4gRmlyZWZveCBkb2VzIGl0J3NcclxuICAgKiBvd24gdGhpbmcgYXMgdXN1YWwsIGFuZCBnZXR0aW5nIGEgY29weSBvZiBOU1MgY2VydHV0aWwgb250byB0aGUgV2luZG93c1xyXG4gICAqIG1hY2hpbmUgdG8gdHJ5IHVwZGF0aW5nIHRoZSBGaXJlZm94IHN0b3JlIGlzIGJhc2ljYWxseSBhIG5pZ2h0bWFyZSwgc28gd2VcclxuICAgKiBkb24ndCBldmVuIHRyeSBpdCAtIHdlIGp1c3QgYmFpbCBvdXQgdG8gdGhlIEdVSS5cclxuICAgKi9cclxuICBhc3luYyBhZGRUb1RydXN0U3RvcmVzKGNlcnRpZmljYXRlUGF0aDogc3RyaW5nLCBvcHRpb25zOiBPcHRpb25zID0ge30pOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIC8vIElFLCBDaHJvbWUsIHN5c3RlbSB1dGlsc1xyXG4gICAgZGVidWcoJ2FkZGluZyBkZXZjZXJ0IHJvb3QgdG8gV2luZG93cyBPUyB0cnVzdCBzdG9yZScpXHJcbiAgICB0cnkge1xyXG4gICAgICBydW4oYGNlcnR1dGlsIC1hZGRzdG9yZSAtdXNlciByb290ICR7IGNlcnRpZmljYXRlUGF0aCB9YCk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGUub3V0cHV0Lm1hcCgoYnVmZmVyOiBCdWZmZXIpID0+IHtcclxuICAgICAgICBpZiAoYnVmZmVyKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhidWZmZXIudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGRlYnVnKCdhZGRpbmcgZGV2Y2VydCByb290IHRvIEZpcmVmb3ggdHJ1c3Qgc3RvcmUnKVxyXG4gICAgLy8gRmlyZWZveCAoZG9uJ3QgZXZlbiB0cnkgTlNTIGNlcnR1dGlsLCBubyBlYXN5IGluc3RhbGwgZm9yIFdpbmRvd3MpXHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCBvcGVuQ2VydGlmaWNhdGVJbkZpcmVmb3goJ3N0YXJ0IGZpcmVmb3gnLCBjZXJ0aWZpY2F0ZVBhdGgpO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIC8vIElnbm9yZSBleGNlcHRpb24sIG1vc3QgbGlrZWx5IEZpcmVmb3ggZG9lc24ndCBleGlzdC5cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFzeW5jIGFkZERvbWFpblRvSG9zdEZpbGVJZk1pc3NpbmcoZG9tYWluOiBzdHJpbmcpIHtcclxuICAgIGxldCBob3N0c0ZpbGVDb250ZW50cyA9IHJlYWQodGhpcy5IT1NUX0ZJTEVfUEFUSCwgJ3V0ZjgnKTtcclxuICAgIGlmICghaG9zdHNGaWxlQ29udGVudHMuaW5jbHVkZXMoZG9tYWluKSkge1xyXG4gICAgICBhd2FpdCBzdWRvKGBlY2hvIDEyNy4wLjAuMSAgJHsgZG9tYWluIH0gPj4gJHsgdGhpcy5IT1NUX0ZJTEVfUEFUSCB9YCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyByZWFkUHJvdGVjdGVkRmlsZShmaWxlcGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIGlmICghZW5jcnlwdGlvbktleSkge1xyXG4gICAgICBlbmNyeXB0aW9uS2V5ID0gYXdhaXQgVUkuZ2V0V2luZG93c0VuY3J5cHRpb25QYXNzd29yZCgpO1xyXG4gICAgfVxyXG4gICAgLy8gVHJ5IHRvIGRlY3J5cHQgdGhlIGZpbGVcclxuICAgIHRyeSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRlY3J5cHQocmVhZChmaWxlcGF0aCwgJ3V0ZjgnKSwgZW5jcnlwdGlvbktleSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIC8vIElmIGl0J3MgYSBiYWQgcGFzc3dvcmQsIGNsZWFyIHRoZSBjYWNoZWQgY29weSBhbmQgcmV0cnlcclxuICAgICAgaWYgKGUubWVzc2FnZS5pbmRleE9mKCdiYWQgZGVjcnlwdCcpID49IC0xKSB7XHJcbiAgICAgICAgZW5jcnlwdGlvbktleSA9IG51bGw7XHJcbiAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMucmVhZFByb3RlY3RlZEZpbGUoZmlsZXBhdGgpO1xyXG4gICAgICB9XHJcbiAgICAgIHRocm93IGU7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBhc3luYyB3cml0ZVByb3RlY3RlZEZpbGUoZmlsZXBhdGg6IHN0cmluZywgY29udGVudHM6IHN0cmluZykge1xyXG4gICAgaWYgKCFlbmNyeXB0aW9uS2V5KSB7XHJcbiAgICAgIGVuY3J5cHRpb25LZXkgPSBhd2FpdCBVSS5nZXRXaW5kb3dzRW5jcnlwdGlvblBhc3N3b3JkKCk7XHJcbiAgICB9XHJcbiAgICBsZXQgZW5jcnlwdGVkQ29udGVudHMgPSB0aGlzLmVuY3J5cHQoY29udGVudHMsIGVuY3J5cHRpb25LZXkpO1xyXG4gICAgd3JpdGUoZmlsZXBhdGgsIGVuY3J5cHRlZENvbnRlbnRzKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZW5jcnlwdCh0ZXh0OiBzdHJpbmcsIGtleTogc3RyaW5nKSB7XHJcbiAgICBsZXQgY2lwaGVyID0gY3J5cHRvLmNyZWF0ZUNpcGhlcignYWVzMjU2JywgbmV3IEJ1ZmZlcihrZXkpKTtcclxuICAgIHJldHVybiBjaXBoZXIudXBkYXRlKHRleHQsICd1dGY4JywgJ2hleCcpICsgY2lwaGVyLmZpbmFsKCdoZXgnKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZGVjcnlwdChlbmNyeXB0ZWQ6IHN0cmluZywga2V5OiBzdHJpbmcpIHtcclxuICAgIGxldCBkZWNpcGhlciA9IGNyeXB0by5jcmVhdGVEZWNpcGhlcignYWVzMjU2JywgbmV3IEJ1ZmZlcihrZXkpKTtcclxuICAgIHJldHVybiBkZWNpcGhlci51cGRhdGUoZW5jcnlwdGVkLCAnaGV4JywgJ3V0ZjgnKSArIGRlY2lwaGVyLmZpbmFsKCd1dGY4Jyk7XHJcbiAgfVxyXG5cclxufSJdfQ==