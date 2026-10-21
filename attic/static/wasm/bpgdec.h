#ifndef STATIC_WASM_BPGDEC_H_GENERATED_
#define STATIC_WASM_BPGDEC_H_GENERATED_
#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>

#include "wasm-rt.h"

#ifndef WASM_RT_MODULE_PREFIX
#define WASM_RT_MODULE_PREFIX
#endif

#define WASM_RT_PASTE_(x, y) x ## y
#define WASM_RT_PASTE(x, y) WASM_RT_PASTE_(x, y)
#define WASM_RT_ADD_PREFIX(x) WASM_RT_PASTE(WASM_RT_MODULE_PREFIX, x)

/* TODO(binji): only use stdint.h types in header */
typedef uint8_t u8;
typedef int8_t s8;
typedef uint16_t u16;
typedef int16_t s16;
typedef uint32_t u32;
typedef int32_t s32;
typedef uint64_t u64;
typedef int64_t s64;
typedef float f32;
typedef double f64;

extern void WASM_RT_ADD_PREFIX(init)(void);

/* import: 'env' 'abort' */
extern void (*Z_envZ_abortZ_vv)(void);
/* import: 'env' 'emscripten_resize_heap' */
extern u32 (*Z_envZ_emscripten_resize_heapZ_ii)(u32);
/* import: 'env' 'emscripten_memcpy_big' */
extern u32 (*Z_envZ_emscripten_memcpy_bigZ_iiii)(u32, u32, u32);
/* import: 'env' 'memory' */
extern wasm_rt_memory_t (*Z_envZ_memory);
/* import: 'env' 'table' */
extern wasm_rt_table_t (*Z_envZ_table);

/* export: '__wasm_call_ctors' */
extern void (*WASM_RT_ADD_PREFIX(Z___wasm_call_ctorsZ_vv))(void);
/* export: 'malloc' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_mallocZ_ii))(u32);
/* export: 'free' */
extern void (*WASM_RT_ADD_PREFIX(Z_freeZ_vi))(u32);
/* export: 'bpg_decoder_get_info' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_bpg_decoder_get_infoZ_iii))(u32, u32);
/* export: 'bpg_decoder_start' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_bpg_decoder_startZ_iii))(u32, u32);
/* export: 'bpg_decoder_get_frame_duration' */
extern void (*WASM_RT_ADD_PREFIX(Z_bpg_decoder_get_frame_durationZ_viii))(u32, u32, u32);
/* export: 'bpg_decoder_get_line' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_bpg_decoder_get_lineZ_iii))(u32, u32);
/* export: 'bpg_decoder_open' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_bpg_decoder_openZ_iv))(void);
/* export: 'bpg_decoder_decode' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_bpg_decoder_decodeZ_iiii))(u32, u32, u32);
/* export: 'bpg_decoder_close' */
extern void (*WASM_RT_ADD_PREFIX(Z_bpg_decoder_closeZ_vi))(u32);
/* export: 'setThrew' */
extern void (*WASM_RT_ADD_PREFIX(Z_setThrewZ_vii))(u32, u32);
/* export: '__data_end' */
extern u32 (*WASM_RT_ADD_PREFIX(Z___data_endZ_i));
/* export: 'stackSave' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_stackSaveZ_iv))(void);
/* export: 'stackAlloc' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_stackAllocZ_ii))(u32);
/* export: 'stackRestore' */
extern void (*WASM_RT_ADD_PREFIX(Z_stackRestoreZ_vi))(u32);
/* export: '__growWasmMemory' */
extern u32 (*WASM_RT_ADD_PREFIX(Z___growWasmMemoryZ_ii))(u32);
/* export: 'dynCall_iii' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_dynCall_iiiZ_iiii))(u32, u32, u32);
/* export: 'dynCall_ii' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_dynCall_iiZ_iii))(u32, u32);
/* export: 'dynCall_iiiii' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_dynCall_iiiiiZ_iiiiii))(u32, u32, u32, u32, u32);
/* export: 'dynCall_vi' */
extern void (*WASM_RT_ADD_PREFIX(Z_dynCall_viZ_vii))(u32, u32);
/* export: 'dynCall_viiiiii' */
extern void (*WASM_RT_ADD_PREFIX(Z_dynCall_viiiiiiZ_viiiiiii))(u32, u32, u32, u32, u32, u32, u32);
/* export: 'dynCall_viiiiiii' */
extern void (*WASM_RT_ADD_PREFIX(Z_dynCall_viiiiiiiZ_viiiiiiii))(u32, u32, u32, u32, u32, u32, u32, u32);
/* export: 'dynCall_viiiiiiiiiiiii' */
extern void (*WASM_RT_ADD_PREFIX(Z_dynCall_viiiiiiiiiiiiiZ_viiiiiiiiiiiiii))(u32, u32, u32, u32, u32, u32, u32, u32, u32, u32, u32, u32, u32, u32);
/* export: 'dynCall_viiiiiiiiii' */
extern void (*WASM_RT_ADD_PREFIX(Z_dynCall_viiiiiiiiiiZ_viiiiiiiiiii))(u32, u32, u32, u32, u32, u32, u32, u32, u32, u32, u32);
/* export: 'dynCall_vii' */
extern void (*WASM_RT_ADD_PREFIX(Z_dynCall_viiZ_viii))(u32, u32, u32);
/* export: 'dynCall_viii' */
extern void (*WASM_RT_ADD_PREFIX(Z_dynCall_viiiZ_viiii))(u32, u32, u32, u32);
/* export: 'dynCall_viiii' */
extern void (*WASM_RT_ADD_PREFIX(Z_dynCall_viiiiZ_viiiii))(u32, u32, u32, u32, u32);
/* export: 'dynCall_iiiiii' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_dynCall_iiiiiiZ_iiiiiii))(u32, u32, u32, u32, u32, u32);
/* export: 'dynCall_iiiiiii' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_dynCall_iiiiiiiZ_iiiiiiii))(u32, u32, u32, u32, u32, u32, u32);
/* export: 'dynCall_iiii' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_dynCall_iiiiZ_iiiii))(u32, u32, u32, u32);
#ifdef __cplusplus
}
#endif

#endif  /* STATIC_WASM_BPGDEC_H_GENERATED_ */
