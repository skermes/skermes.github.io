/**
 * A puzzle being played.
 */
export class Game {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GameFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_game_free(ptr, 0);
    }
    /**
     * Adds an empty rule at `index`, between runs, or just after the given
     * rules if `index` is among them. Returns where it went.
     * @param {number} index
     * @returns {number | undefined}
     */
    add_rule(index) {
        const ret = wasm.game_add_rule(this.__wbg_ptr, index);
        return ret === Number.MAX_SAFE_INTEGER ? undefined : ret;
    }
    /**
     * Empties the board, between runs.
     */
    clear() {
        wasm.game_clear(this.__wbg_ptr);
    }
    /**
     * Where an object held by its cell (`grip_x`, `grip_y`) would be put
     * down with the cursor over board cell (x, y), as `{x, y, free}`, or
     * undefined if there's no such object.
     * @param {string} kind
     * @param {number} index
     * @param {number} x
     * @param {number} y
     * @param {number} grip_x
     * @param {number} grip_y
     * @returns {any}
     */
    drop_spot(kind, index, x, y, grip_x, grip_y) {
        const val2 = +index;
        const val3 = +x;
        const val4 = +y;
        const val5 = +grip_x;
        const val6 = +grip_y;
        const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.game_drop_spot(this.__wbg_ptr, ptr0, len0, val2, val3, val4, val5, val6);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * A fresh attempt at the puzzle in `toml`. Throws if it can't be read or
     * played.
     * @param {string} toml
     */
    constructor(toml) {
        const ptr0 = passStringToWasm0(toml, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.game_new(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        this.__wbg_ptr = ret[0];
        GameFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Paints board cell (x, y) with the value named `value`, between runs,
     * as long as it can be painted. Returns whether it was.
     * @param {number} x
     * @param {number} y
     * @param {string} value
     * @returns {boolean}
     */
    paint(x, y, value) {
        const val2 = +x;
        const val3 = +y;
        const ptr0 = passStringToWasm0(value, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.game_paint(this.__wbg_ptr, val2, val3, ptr0, len0);
        return ret !== 0;
    }
    pause() {
        wasm.game_pause(this.__wbg_ptr);
    }
    /**
     * Puts an object with its top-left cell at (x, y), moving it if it's
     * already on the board, as long as it's between runs and there's room.
     * Returns whether it was put there.
     * @param {string} kind
     * @param {number} index
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    place(kind, index, x, y) {
        const val2 = +index;
        const val3 = +x;
        const val4 = +y;
        const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.game_place(this.__wbg_ptr, ptr0, len0, val2, val3, val4);
        return ret !== 0;
    }
    /**
     * Removes rule `index`, if the player can change it. Returns whether it
     * was removed.
     * @param {number} index
     * @returns {boolean}
     */
    remove_rule(index) {
        const ret = wasm.game_remove_rule(this.__wbg_ptr, index);
        return ret !== 0;
    }
    /**
     * Ends the run, going back to the board it started from.
     */
    reset() {
        wasm.game_reset(this.__wbg_ptr);
    }
    /**
     * Sizes the board to fit the page, between runs, keeping whatever
     * cells and objects still fit. A run keeps the size it started with.
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        wasm.game_resize(this.__wbg_ptr, width, height);
    }
    /**
     * Sets cell `cell` of the left or right side of rule `index` to the
     * matcher named `matcher`, if the player can change the rule. Returns
     * whether it was set.
     * @param {number} index
     * @param {boolean} right
     * @param {number} cell
     * @param {string} matcher
     * @returns {boolean}
     */
    set_rule_cell(index, right, cell, matcher) {
        const val2 = +index;
        const val3 = +right;
        const val4 = +cell;
        const ptr0 = passStringToWasm0(matcher, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.game_set_rule_cell(this.__wbg_ptr, val2, val3, val4, ptr0, len0);
        return ret !== 0;
    }
    /**
     * Starts a run, or carries on with a paused one.
     */
    start() {
        wasm.game_start(this.__wbg_ptr);
    }
    /**
     * Everything the page shows; see [`Snapshot`].
     * @returns {any}
     */
    state() {
        const ret = wasm.game_state(this.__wbg_ptr);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return takeFromExternrefTable0(ret[0]);
    }
    /**
     * Runs a tick, first starting a paused run if there isn't one. The run
     * pauses if the tick fails or solves the puzzle.
     */
    step() {
        wasm.game_step(this.__wbg_ptr);
    }
    /**
     * Swaps rules `index` and `index + 1`, if the player can change both.
     * Returns whether they were swapped.
     * @param {number} index
     * @returns {boolean}
     */
    swap_rules(index) {
        const ret = wasm.game_swap_rules(this.__wbg_ptr, index);
        return ret !== 0;
    }
    /**
     * Takes an object off the board, back to the tray, between runs.
     * Returns whether it was taken off.
     * @param {string} kind
     * @param {number} index
     * @returns {boolean}
     */
    unplace(kind, index) {
        const val2 = +index;
        const ptr0 = passStringToWasm0(kind, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.game_unplace(this.__wbg_ptr, ptr0, len0, val2);
        return ret !== 0;
    }
}
if (Symbol.dispose) Game.prototype[Symbol.dispose] = Game.prototype.free;

/**
 * The cell values in palette order, each with its color: `[{name, color}]`.
 * @returns {any}
 */
export function palette() {
    const ret = wasm.palette();
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_208446807d0d1e30: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_String_8564e559799eccda: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 1, len1, true);
            getDataViewMemory0().setInt32((arg0 >>> 0) + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_4c88d8bf264fd984: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_new_37eb45aaf5eeb820: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_cd4348290afae586: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_set_d2d33b52458e984a: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_set_e4b9a833d288759a: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbindgen_generic_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_generic_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_generic_0000000000000003: function(arg0) {
            // Cast intrinsic for `U64 -> Externref`.
            const ret = BigInt.asUintN(64, arg0);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            table.set(0, undefined);
            table.set(1024, undefined);
            table.set(1025, null);
            table.set(1026, true);
            table.set(1027, false);
        },
    };
    return {
        __proto__: null,
        "./rwweb_bg.js": import0,
    };
}

const GameFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_game_free(ptr, 1));

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(bytes) {
    numBytesDecoded += bytes.length;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true });
        cachedTextDecoder.decode();
        numBytesDecoded = bytes.length;
    }
    return cachedTextDecoder.decode(bytes);
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

let __wbg_init_promise;
async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;
    if (__wbg_init_promise === undefined) {
        __wbg_init_promise = __wbg_init_once(module_or_path);
        __wbg_init_promise.catch(() => { __wbg_init_promise = undefined; });
    }
    return __wbg_init_promise;
}

async function __wbg_init_once(module_or_path) {

    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('rwweb_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
