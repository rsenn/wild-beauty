#ifndef STATIC_WASM_BPGDEC_S_H_GENERATED_
#define STATIC_WASM_BPGDEC_S_H_GENERATED_
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

/* import: 'a' 'a' */
extern void (*Z_aZ_aZ_vv)(void);
/* import: 'a' 'b' */
extern u32 (*Z_aZ_bZ_iiii)(u32, u32, u32);
/* import: 'a' 'c' */
extern u32 (*Z_aZ_cZ_ii)(u32);
/* import: 'a' 'memory' */
extern wasm_rt_memory_t (*Z_aZ_memory);
/* import: 'a' 'table' */
extern wasm_rt_table_t (*Z_aZ_table);

/* export: 'd' */
extern void (*WASM_RT_ADD_PREFIX(Z_dZ_vv))(void);
/* export: 'e' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_eZ_ii))(u32);
/* export: 'f' */
extern void (*WASM_RT_ADD_PREFIX(Z_fZ_vi))(u32);
/* export: 'g' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_gZ_iii))(u32, u32);
/* export: 'h' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_hZ_iii))(u32, u32);
/* export: 'i' */
extern void (*WASM_RT_ADD_PREFIX(Z_iZ_viii))(u32, u32, u32);
/* export: 'j' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_jZ_iii))(u32, u32);
/* export: 'k' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_kZ_iv))(void);
/* export: 'l' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_lZ_iiii))(u32, u32, u32);
/* export: 'm' */
extern void (*WASM_RT_ADD_PREFIX(Z_mZ_vi))(u32);
/* export: 'n' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_nZ_iv))(void);
/* export: 'o' */
extern u32 (*WASM_RT_ADD_PREFIX(Z_oZ_ii))(u32);
/* export: 'p' */
extern void (*WASM_RT_ADD_PREFIX(Z_pZ_vi))(u32);
/* export: 'q' */
extern void (*WASM_RT_ADD_PREFIX(Z_qZ_vii))(u32, u32);
#ifdef __cplusplus
}
#endif

#endif  /* STATIC_WASM_BPGDEC_S_H_GENERATED_ */
