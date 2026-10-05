#!/usr/bin/env python3
"""由高解析 logo（透明背景 PNG）產生網站圖示：白底、置中、四周留白（僅用 Python 標準函式庫，不需安裝任何套件）。

用法：python3 tools/make_icons.py [來源 PNG，預設 logo-hires.png]
輸出：icons/apple-touch-icon.png (180)、icon-192.png、icon-512.png、icon-maskable-512.png
為什麼要白底：iPhone 會把圖示的透明區域顯示成黑色。
為什麼留白：iOS 會裁圓角；Android 的「可遮罩圖示」安全區為中央 80% 圓形，所以 maskable 版 logo 只佔 62%。
"""
import struct, sys, zlib, os

# 檔名: (畫布邊長, logo 高度占畫布比例)。maskable 版本留較大安全邊界（Android 會依裝置裁成圓形／圓角）。
SIZES = {'apple-touch-icon.png': (180, 0.80), 'icon-192.png': (192, 0.80), 'icon-512.png': (512, 0.80), 'icon-maskable-512.png': (512, 0.62)}

def read_png(path):
    d = open(path, 'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n', '不是 PNG'
    i, idat, hdr = 8, b'', None
    while i < len(d):
        n, = struct.unpack('>I', d[i:i+4]); t = d[i+4:i+8]; body = d[i+8:i+8+n]
        if t == b'IHDR': hdr = struct.unpack('>IIBBBBB', body)
        elif t == b'IDAT': idat += body
        i += 12 + n
    w, h, depth, ctype, _, _, interlace = hdr
    assert depth == 8 and ctype == 6 and interlace == 0, '只支援 8 位元 RGBA、非交錯 PNG（本檔：%r）' % (hdr,)
    raw = zlib.decompress(idat); bpp = 4; stride = w * bpp
    out = bytearray(h * stride); prev = bytearray(stride); p = 0
    for y in range(h):
        f = raw[p]; line = bytearray(raw[p+1:p+1+stride]); p += 1 + stride
        if f == 1:
            for x in range(bpp, stride): line[x] = (line[x] + line[x-bpp]) & 255
        elif f == 2:
            for x in range(stride): line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                a = line[x-bpp] if x >= bpp else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = line[x-bpp] if x >= bpp else 0; b = prev[x]; c = prev[x-bpp] if x >= bpp else 0
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        elif f != 0: raise ValueError('未知濾波器 %d' % f)
        out[y*stride:(y+1)*stride] = line; prev = line
    return w, h, out

def crop_on_white(w, h, rgba):
    """裁掉透明邊界，並把半透明像素疊在白底上，回傳不透明 RGB。"""
    x0, y0, x1, y1 = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if rgba[(y*w + x)*4 + 3] > 10:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
    cw, ch = x1 - x0 + 1, y1 - y0 + 1
    rgb = bytearray(cw * ch * 3)
    for y in range(ch):
        for x in range(cw):
            s = ((y0 + y)*w + (x0 + x))*4; a = rgba[s+3] / 255.0; o = (y*cw + x)*3
            for c in range(3): rgb[o+c] = int(round(rgba[s+c]*a + 255*(1-a)))
    return cw, ch, rgb

def resize_area(w, h, rgb, nw, nh):
    """面積平均縮放（縮小時品質最好）。"""
    def axis(n_in, n_out):
        scale = n_in / n_out; res = []
        for o in range(n_out):
            a, b = o*scale, (o+1)*scale; i0, i1 = int(a), min(int(b - 1e-9), n_in - 1); ws = []
            for i in range(i0, i1 + 1):
                ws.append((i, max(0.0, min(b, i+1) - max(a, i))))
            tot = sum(wt for _, wt in ws) or 1.0
            res.append([(i, wt/tot) for i, wt in ws])
        return res
    ax, ay = axis(w, nw), axis(h, nh)
    tmp = [0.0] * (nw * h * 3)
    for y in range(h):
        row = y * w * 3
        for ox in range(nw):
            r = g = b = 0.0
            for i, wt in ax[ox]:
                s = row + i*3; r += rgb[s]*wt; g += rgb[s+1]*wt; b += rgb[s+2]*wt
            t = (y*nw + ox)*3; tmp[t], tmp[t+1], tmp[t+2] = r, g, b
    out = bytearray(nw * nh * 3)
    for oy in range(nh):
        for ox in range(nw):
            r = g = b = 0.0
            for j, wt in ay[oy]:
                t = (j*nw + ox)*3; r += tmp[t]*wt; g += tmp[t+1]*wt; b += tmp[t+2]*wt
            o = (oy*nw + ox)*3
            out[o], out[o+1], out[o+2] = min(255, int(round(r))), min(255, int(round(g))), min(255, int(round(b)))
    return out

def write_png(path, w, h, rgb):
    raw = b''.join(b'\x00' + bytes(rgb[y*w*3:(y+1)*w*3]) for y in range(h))
    def chunk(t, data): return struct.pack('>I', len(data)) + t + data + struct.pack('>I', zlib.crc32(t + data) & 0xffffffff)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

def make(src, outdir):
    w, h, rgba = read_png(src)
    cw, ch, rgb = crop_on_white(w, h, rgba)
    os.makedirs(outdir, exist_ok=True)
    for name, (S, fit) in SIZES.items():
        k = fit * S / max(cw, ch); nw, nh = max(1, round(cw*k)), max(1, round(ch*k))
        small = resize_area(cw, ch, rgb, nw, nh)
        canvas = bytearray(b'\xff' * (S*S*3)); ox, oy = (S - nw)//2, (S - nh)//2
        for y in range(nh):
            canvas[((oy+y)*S + ox)*3:((oy+y)*S + ox + nw)*3] = small[y*nw*3:(y+1)*nw*3]
        write_png(os.path.join(outdir, name), S, S, canvas)
        print('%s %dx%d（logo %dx%d）' % (name, S, S, nw, nh))

if __name__ == '__main__':
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'logo-hires.png')
    make(src, os.path.join(root, 'icons'))
