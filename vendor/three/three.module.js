import{Matrix3,Vector2,Color,Vector3,mergeUniforms as st,CubeUVReflectionMapping,Mesh,BoxGeometry,ShaderMaterial,BackSide,cloneUniforms as yt,Matrix4,ColorManagement,SRGBTransfer,PlaneGeometry,FrontSide,getUnlitUniformColorSpace as en,IntType,warn,HalfFloatType,UnsignedByteType,FloatType,RGBAFormat,Plane,CubeReflectionMapping,CubeRefractionMapping,BufferGeometry,OrthographicCamera,PerspectiveCamera,NoToneMapping,MeshBasicMaterial,NoBlending,WebGLRenderTarget,BufferAttribute,LinearSRGBColorSpace,LinearFilter,CubeTexture,LinearMipmapLinearFilter,CubeCamera,EquirectangularReflectionMapping,EquirectangularRefractionMapping,warnOnce,Uint32BufferAttribute,Uint16BufferAttribute,error,DataArrayTexture,Vector4,Float32BufferAttribute,RawShaderMaterial,CustomToneMapping,NeutralToneMapping,AgXToneMapping,ACESFilmicToneMapping,CineonToneMapping,ReinhardToneMapping,LinearToneMapping,Data3DTexture,GreaterEqualCompare,LessEqualCompare,DepthTexture,Texture,GLSL3,VSMShadowMap,PCFShadowMap,AddOperation,MixOperation,MultiplyOperation,LinearTransfer,UniformsUtils,DoubleSide,NormalBlending,TangentSpaceNormalMap,ObjectSpaceNormalMap,Layers,RGFormat,RG11_EAC_Format,RED_GREEN_RGTC2_Format,MeshDepthMaterial,MeshDistanceMaterial,PCFSoftShadowMap,DepthFormat,NearestFilter,CubeDepthTexture,UnsignedIntType,Frustum,LessEqualDepth,ReverseSubtractEquation,SubtractEquation,AddEquation,OneMinusConstantAlphaFactor,ConstantAlphaFactor,OneMinusConstantColorFactor,ConstantColorFactor,OneMinusDstAlphaFactor,OneMinusDstColorFactor,OneMinusSrcAlphaFactor,OneMinusSrcColorFactor,DstAlphaFactor,DstColorFactor,SrcAlphaSaturateFactor,SrcAlphaFactor,SrcColorFactor,OneFactor,ZeroFactor,NotEqualDepth,GreaterDepth,GreaterEqualDepth,EqualDepth,LessDepth,AlwaysDepth,NeverDepth,CullFaceNone,CullFaceBack,CullFaceFront,CustomBlending,MultiplyBlending,SubtractiveBlending,AdditiveBlending,ReversedDepthFuncs as zn,MinEquation,MaxEquation,MirroredRepeatWrapping,ClampToEdgeWrapping,RepeatWrapping,LinearMipmapNearestFilter,NearestMipmapLinearFilter,NearestMipmapNearestFilter,NotEqualCompare,GreaterCompare,EqualCompare,LessCompare,AlwaysCompare,NeverCompare,NoColorSpace,DepthStencilFormat,getByteLength as tn,UnsignedInt248Type,UnsignedShortType,createElementNS as Xn,UnsignedShort4444Type,UnsignedShort5551Type,UnsignedInt5999Type,UnsignedInt101111Type,ByteType,ShortType,AlphaFormat,RGBFormat,RedFormat,RedIntegerFormat,RGIntegerFormat,RGBAIntegerFormat,RGB_S3TC_DXT1_Format,RGBA_S3TC_DXT1_Format,RGBA_S3TC_DXT3_Format,RGBA_S3TC_DXT5_Format,RGB_PVRTC_4BPPV1_Format,RGB_PVRTC_2BPPV1_Format,RGBA_PVRTC_4BPPV1_Format,RGBA_PVRTC_2BPPV1_Format,RGB_ETC1_Format,RGB_ETC2_Format,RGBA_ETC2_EAC_Format,R11_EAC_Format,SIGNED_R11_EAC_Format,SIGNED_RG11_EAC_Format,RGBA_ASTC_4x4_Format,RGBA_ASTC_5x4_Format,RGBA_ASTC_5x5_Format,RGBA_ASTC_6x5_Format,RGBA_ASTC_6x6_Format,RGBA_ASTC_8x5_Format,RGBA_ASTC_8x6_Format,RGBA_ASTC_8x8_Format,RGBA_ASTC_10x5_Format,RGBA_ASTC_10x6_Format,RGBA_ASTC_10x8_Format,RGBA_ASTC_10x10_Format,RGBA_ASTC_12x10_Format,RGBA_ASTC_12x12_Format,RGBA_BPTC_Format,RGB_BPTC_SIGNED_Format,RGB_BPTC_UNSIGNED_Format,RED_RGTC1_Format,SIGNED_RED_RGTC1_Format,SIGNED_RED_GREEN_RGTC2_Format,ExternalTexture,EventDispatcher,ArrayCamera,WebXRController,RAD2DEG as Kn,DataTexture,createCanvasElement,SRGBColorSpace,REVISION,log,WebGLCoordinateSystem,probeAsync as Yn}from"./three.core.js";export{AdditiveAnimationBlendMode,AlwaysStencilFunc,AmbientLight,AnimationAction,AnimationClip,AnimationLoader,AnimationMixer,AnimationObjectGroup,AnimationUtils,ArcCurve,ArrowHelper,AttachedBindMode,Audio,AudioAnalyser,AudioContext,AudioListener,AudioLoader,AxesHelper,BasicDepthPacking,BasicShadowMap,BatchedMesh,BezierInterpolant,Bone,BooleanKeyframeTrack,Box2,Box3,Box3Helper,BoxHelper,BufferGeometryLoader,Cache,Camera,CameraHelper,CanvasTexture,CapsuleGeometry,CatmullRomCurve3,CircleGeometry,Clock,ColorKeyframeTrack,Compatibility,CompressedArrayTexture,CompressedCubeTexture,CompressedTexture,CompressedTextureLoader,ConeGeometry,Controls,CubeTextureLoader,CubicBezierCurve,CubicBezierCurve3,CubicInterpolant,CullFaceFrontBack,Curve,CurvePath,CylinderGeometry,Cylindrical,DataTextureLoader,DataUtils,DecrementStencilOp,DecrementWrapStencilOp,DefaultLoadingManager,DetachedBindMode,DirectionalLight,DirectionalLightHelper,DiscreteInterpolant,DodecahedronGeometry,DynamicCopyUsage,DynamicDrawUsage,DynamicReadUsage,EdgesGeometry,EllipseCurve,EqualStencilFunc,Euler,ExtrudeGeometry,FileLoader,Float16BufferAttribute,Fog,FogExp2,FramebufferTexture,FrustumArray,GLBufferAttribute,GLSL1,GreaterEqualStencilFunc,GreaterStencilFunc,GridHelper,Group,HTMLTexture,HemisphereLight,HemisphereLightHelper,IcosahedronGeometry,ImageBitmapLoader,ImageLoader,ImageUtils,IncrementStencilOp,IncrementWrapStencilOp,InstancedBufferAttribute,InstancedBufferGeometry,InstancedInterleavedBuffer,InstancedMesh,Int16BufferAttribute,Int32BufferAttribute,Int8BufferAttribute,InterleavedBuffer,InterleavedBufferAttribute,Interpolant,InterpolateBezier,InterpolateDiscrete,InterpolateLinear,InterpolateSmooth,InterpolationSamplingMode,InterpolationSamplingType,InvertStencilOp,KeepStencilOp,KeyframeTrack,LOD,LatheGeometry,LessEqualStencilFunc,LessStencilFunc,Light,LightProbe,LightShadow,Line,Line3,LineBasicMaterial,LineCurve,LineCurve3,LineDashedMaterial,LineLoop,LineSegments,LinearInterpolant,LinearMipMapLinearFilter,LinearMipMapNearestFilter,Loader,LoaderUtils,LoadingManager,LoopOnce,LoopPingPong,LoopRepeat,MOUSE,Material,MaterialBlending,MaterialLoader,MathUtils,Matrix2,MeshLambertMaterial,MeshMatcapMaterial,MeshNormalMaterial,MeshPhongMaterial,MeshPhysicalMaterial,MeshStandardMaterial,MeshToonMaterial,NearestMipMapLinearFilter,NearestMipMapNearestFilter,NeverStencilFunc,NoNormalPacking,NormalAnimationBlendMode,NormalGAPacking,NormalRGPacking,NotEqualStencilFunc,NumberKeyframeTrack,Object3D,ObjectLoader,OctahedronGeometry,Path,PlaneHelper,PointLight,PointLightHelper,Points,PointsMaterial,PolarGridHelper,PolyhedronGeometry,PositionalAudio,PropertyBinding,PropertyMixer,QuadraticBezierCurve,QuadraticBezierCurve3,Quaternion,QuaternionKeyframeTrack,QuaternionLinearInterpolant,RGBADepthPacking,RGBDepthPacking,RGBIntegerFormat,RGDepthPacking,Ray,Raycaster,RectAreaLight,RenderObjectRefreshType,RenderTarget,RenderTarget3D,ReplaceStencilOp,RingGeometry,Scene,ShadowMaterial,Shape,ShapeGeometry,ShapePath,ShapeUtils,Skeleton,SkeletonHelper,SkinnedMesh,Source,Sphere,SphereGeometry,Spherical,SphericalHarmonics3,SplineCurve,SpotLight,SpotLightHelper,Sprite,SpriteMaterial,StaticCopyUsage,StaticDrawUsage,StaticReadUsage,StereoCamera,StreamCopyUsage,StreamDrawUsage,StreamReadUsage,StringKeyframeTrack,TOUCH,TetrahedronGeometry,TextureLoader,TextureSource,TextureUtils,Timer,TimestampQuery,TorusGeometry,TorusKnotGeometry,Triangle,TriangleFanDrawMode,TriangleStripDrawMode,TrianglesDrawMode,TubeGeometry,UVMapping,Uint8BufferAttribute,Uint8ClampedBufferAttribute,Uniform,UniformsGroup,VectorKeyframeTrack,VideoFrameTexture,VideoTexture,WebGL3DRenderTarget,WebGLArrayRenderTarget,WebGPUCoordinateSystem,WireframeGeometry,WrapAroundEnding,ZeroCurvatureEnding,ZeroSlopeEnding,ZeroStencilOp,getConsoleFunction,setConsoleFunction}from"./three.core.js";function nn(){let e=null,n=!1,t=null,i=null;function f(l,u){i=e.requestAnimationFrame(f);t(l,u)}return{start:function(){if(n===!0)return;if(t===null)return;if(e===null)return;i=e.requestAnimationFrame(f);n=!0},stop:function(){if(e!==null)e.cancelAnimationFrame(i);n=!1},setAnimationLoop:function(l){t=l},setContext:function(l){e=l}}}function qn(e){const n=new WeakMap;function t(_,F){const{array:x,usage:y}=_,N=x.byteLength,h=e.createBuffer();e.bindBuffer(F,h);e.bufferData(F,x,y);_.onUploadCallback();let T;if(x instanceof Float32Array)T=e.FLOAT;else if(typeof Float16Array<"u"&&x instanceof Float16Array)T=e.HALF_FLOAT;else if(x instanceof Uint16Array)if(_.isFloat16BufferAttribute)T=e.HALF_FLOAT;else T=e.UNSIGNED_SHORT;else if(x instanceof Int16Array)T=e.SHORT;else if(x instanceof Uint32Array)T=e.UNSIGNED_INT;else if(x instanceof Int32Array)T=e.INT;else if(x instanceof Int8Array)T=e.BYTE;else if(x instanceof Uint8Array)T=e.UNSIGNED_BYTE;else if(x instanceof Uint8ClampedArray)T=e.UNSIGNED_BYTE;else throw Error("THREE.WebGLAttributes: Unsupported buffer data format: "+x);return{buffer:h,type:T,bytesPerElement:x.BYTES_PER_ELEMENT,version:_.version,size:N}}function i(_,F,x){const{array:y,updateRanges:N}=F;e.bindBuffer(x,_);if(N.length===0)e.bufferSubData(x,0,y);else{N.sort((T,P)=>T.start-P.start);let h=0;for(let T=1;T<N.length;T++){const P=N[h],W=N[T];if(W.start<=P.start+P.count+1)P.count=Math.max(P.count,W.start+W.count-P.start);else{++h;N[h]=W}}N.length=h+1;for(let T=0,P=N.length;T<P;T++){const W=N[T];e.bufferSubData(x,W.start*y.BYTES_PER_ELEMENT,y,W.start,W.count)}F.clearUpdateRanges()}F.onUploadCallback()}function f(_){if(_.isInterleavedBufferAttribute)_=_.data;return n.get(_)}function l(_){if(_.isInterleavedBufferAttribute)_=_.data;const F=n.get(_);if(F){e.deleteBuffer(F.buffer);n.delete(_)}}function u(_,F){if(_.isInterleavedBufferAttribute)_=_.data;if(_.isGLBufferAttribute){const y=n.get(_);if(!y||y.version<_.version)n.set(_,{buffer:_.buffer,type:_.type,bytesPerElement:_.elementSize,version:_.version});return}const x=n.get(_);if(x===void 0)n.set(_,t(_,F));else if(x.version<_.version){if(x.size!==_.array.byteLength)throw Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(x.buffer,_,F);x.version=_.version}}return{get:f,remove:l,update:u}}var Zn=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,$n=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Qn=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Jn=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,jn=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ei=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ti=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,ni=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,ii=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,ri=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,ai=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,oi=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,si=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,li=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,ci=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,fi=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,di=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ui=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,pi=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,hi=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,mi=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,_i=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,gi=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,vi=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Si=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Ei=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Mi=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,xi=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Ti=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ai=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ri="gl_FragColor = linearToOutputTexel( gl_FragColor );",bi=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Ci=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Pi=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Li=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Ui=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Di=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,wi=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Ii=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Ni=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,yi=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Fi=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Oi=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Bi=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Gi=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Hi=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Vi=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Wi=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,ki=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,zi=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Xi=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ki=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Yi=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,qi=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Zi=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,$i=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Qi=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Ji=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,ji=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,er=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,tr=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,nr=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,ir=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,rr=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ar=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,or=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,sr=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,lr=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,cr=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,fr=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,dr=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,ur=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,pr=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,hr=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,mr=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,_r=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,gr=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,vr=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Sr=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Er=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Mr=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,xr=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Tr=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Ar=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Rr=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,br=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Cr=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Pr=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Lr=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ur=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Dr=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,wr=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Ir=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Nr=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,yr=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Fr=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Or=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Br=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Gr=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Hr=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Vr=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Wr=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,kr=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,zr=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Xr=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Kr=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Yr=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,qr=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Zr=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,$r=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Qr=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Jr=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,jr=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ea=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ta=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,na=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,ia=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,ra=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,aa=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,oa=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sa=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,la=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,ca=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,fa=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,da=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ua=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pa=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,ha=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ma=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,_a=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,ga=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,va=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Sa=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Ea=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ma=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,xa=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ta=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Aa=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ra=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ba=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ca=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Pa=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,ShaderChunk={alphahash_fragment:Zn,alphahash_pars_fragment:$n,alphamap_fragment:Qn,alphamap_pars_fragment:Jn,alphatest_fragment:jn,alphatest_pars_fragment:ei,aomap_fragment:ti,aomap_pars_fragment:ni,batching_pars_vertex:ii,batching_vertex:ri,begin_vertex:ai,beginnormal_vertex:oi,bsdfs:si,iridescence_fragment:li,bumpmap_pars_fragment:ci,clipping_planes_fragment:fi,clipping_planes_pars_fragment:di,clipping_planes_pars_vertex:ui,clipping_planes_vertex:pi,color_fragment:hi,color_pars_fragment:mi,color_pars_vertex:_i,color_vertex:gi,common:vi,cube_uv_reflection_fragment:Si,defaultnormal_vertex:Ei,displacementmap_pars_vertex:Mi,displacementmap_vertex:xi,emissivemap_fragment:Ti,emissivemap_pars_fragment:Ai,colorspace_fragment:Ri,colorspace_pars_fragment:bi,envmap_fragment:Ci,envmap_common_pars_fragment:Pi,envmap_pars_fragment:Li,envmap_pars_vertex:Ui,envmap_physical_pars_fragment:Vi,envmap_vertex:Di,fog_vertex:wi,fog_pars_vertex:Ii,fog_fragment:Ni,fog_pars_fragment:yi,gradientmap_pars_fragment:Fi,lightmap_pars_fragment:Oi,lights_lambert_fragment:Bi,lights_lambert_pars_fragment:Gi,lights_pars_begin:Hi,lights_toon_fragment:Wi,lights_toon_pars_fragment:ki,lights_phong_fragment:zi,lights_phong_pars_fragment:Xi,lights_physical_fragment:Ki,lights_physical_pars_fragment:Yi,lights_fragment_begin:qi,lights_fragment_maps:Zi,lights_fragment_end:$i,lightprobes_pars_fragment:Qi,logdepthbuf_fragment:Ji,logdepthbuf_pars_fragment:ji,logdepthbuf_pars_vertex:er,logdepthbuf_vertex:tr,map_fragment:nr,map_pars_fragment:ir,map_particle_fragment:rr,map_particle_pars_fragment:ar,metalnessmap_fragment:or,metalnessmap_pars_fragment:sr,morphinstance_vertex:lr,morphcolor_vertex:cr,morphnormal_vertex:fr,morphtarget_pars_vertex:dr,morphtarget_vertex:ur,normal_fragment_begin:pr,normal_fragment_maps:hr,normal_pars_fragment:mr,normal_pars_vertex:_r,normal_vertex:gr,normalmap_pars_fragment:vr,clearcoat_normal_fragment_begin:Sr,clearcoat_normal_fragment_maps:Er,clearcoat_pars_fragment:Mr,iridescence_pars_fragment:xr,opaque_fragment:Tr,packing:Ar,premultiplied_alpha_fragment:Rr,project_vertex:br,dithering_fragment:Cr,dithering_pars_fragment:Pr,roughnessmap_fragment:Lr,roughnessmap_pars_fragment:Ur,shadowmap_pars_fragment:Dr,shadowmap_pars_vertex:wr,shadowmap_vertex:Ir,shadowmask_pars_fragment:Nr,skinbase_vertex:yr,skinning_pars_vertex:Fr,skinning_vertex:Or,skinnormal_vertex:Br,specularmap_fragment:Gr,specularmap_pars_fragment:Hr,tonemapping_fragment:Vr,tonemapping_pars_fragment:Wr,transmission_fragment:kr,transmission_pars_fragment:zr,uv_pars_fragment:Xr,uv_pars_vertex:Kr,uv_vertex:Yr,worldpos_vertex:qr,background_vert:Zr,background_frag:$r,backgroundCube_vert:Qr,backgroundCube_frag:Jr,cube_vert:jr,cube_frag:ea,depth_vert:ta,depth_frag:na,distance_vert:ia,distance_frag:ra,equirect_vert:aa,equirect_frag:oa,linedashed_vert:sa,linedashed_frag:la,meshbasic_vert:ca,meshbasic_frag:fa,meshlambert_vert:da,meshlambert_frag:ua,meshmatcap_vert:pa,meshmatcap_frag:ha,meshnormal_vert:ma,meshnormal_frag:_a,meshphong_vert:ga,meshphong_frag:va,meshphysical_vert:Sa,meshphysical_frag:Ea,meshtoon_vert:Ma,meshtoon_frag:xa,points_vert:Ta,points_frag:Aa,shadow_vert:Ra,shadow_frag:ba,sprite_vert:Ca,sprite_frag:Pa},UniformsLib={common:{diffuse:{value:new Color(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Matrix3},alphaMap:{value:null},alphaMapTransform:{value:new Matrix3},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Matrix3}},envmap:{envMap:{value:null},envMapRotation:{value:new Matrix3},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:0.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Matrix3}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Matrix3}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Matrix3},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Matrix3},normalScale:{value:new Vector2(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Matrix3},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Matrix3}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Matrix3}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Matrix3}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:0.00025},fogNear:{value:1},fogFar:{value:2000},fogColor:{value:new Color(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new Vector3},probesMax:{value:new Vector3},probesResolution:{value:new Vector3}},points:{diffuse:{value:new Color(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Matrix3},alphaTest:{value:0},uvTransform:{value:new Matrix3}},sprite:{diffuse:{value:new Color(16777215)},opacity:{value:1},center:{value:new Vector2(0.5,0.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Matrix3},alphaMap:{value:null},alphaMapTransform:{value:new Matrix3},alphaTest:{value:0}}},ShaderLib={basic:{uniforms:st([UniformsLib.common,UniformsLib.specularmap,UniformsLib.envmap,UniformsLib.aomap,UniformsLib.lightmap,UniformsLib.fog]),vertexShader:ShaderChunk.meshbasic_vert,fragmentShader:ShaderChunk.meshbasic_frag},lambert:{uniforms:st([UniformsLib.common,UniformsLib.specularmap,UniformsLib.envmap,UniformsLib.aomap,UniformsLib.lightmap,UniformsLib.emissivemap,UniformsLib.bumpmap,UniformsLib.normalmap,UniformsLib.displacementmap,UniformsLib.fog,UniformsLib.lights,{emissive:{value:new Color(0)},envMapIntensity:{value:1}}]),vertexShader:ShaderChunk.meshlambert_vert,fragmentShader:ShaderChunk.meshlambert_frag},phong:{uniforms:st([UniformsLib.common,UniformsLib.specularmap,UniformsLib.envmap,UniformsLib.aomap,UniformsLib.lightmap,UniformsLib.emissivemap,UniformsLib.bumpmap,UniformsLib.normalmap,UniformsLib.displacementmap,UniformsLib.fog,UniformsLib.lights,{emissive:{value:new Color(0)},specular:{value:new Color(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:ShaderChunk.meshphong_vert,fragmentShader:ShaderChunk.meshphong_frag},standard:{uniforms:st([UniformsLib.common,UniformsLib.envmap,UniformsLib.aomap,UniformsLib.lightmap,UniformsLib.emissivemap,UniformsLib.bumpmap,UniformsLib.normalmap,UniformsLib.displacementmap,UniformsLib.roughnessmap,UniformsLib.metalnessmap,UniformsLib.fog,UniformsLib.lights,{emissive:{value:new Color(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:ShaderChunk.meshphysical_vert,fragmentShader:ShaderChunk.meshphysical_frag},toon:{uniforms:st([UniformsLib.common,UniformsLib.aomap,UniformsLib.lightmap,UniformsLib.emissivemap,UniformsLib.bumpmap,UniformsLib.normalmap,UniformsLib.displacementmap,UniformsLib.gradientmap,UniformsLib.fog,UniformsLib.lights,{emissive:{value:new Color(0)}}]),vertexShader:ShaderChunk.meshtoon_vert,fragmentShader:ShaderChunk.meshtoon_frag},matcap:{uniforms:st([UniformsLib.common,UniformsLib.bumpmap,UniformsLib.normalmap,UniformsLib.displacementmap,UniformsLib.fog,{matcap:{value:null}}]),vertexShader:ShaderChunk.meshmatcap_vert,fragmentShader:ShaderChunk.meshmatcap_frag},points:{uniforms:st([UniformsLib.points,UniformsLib.fog]),vertexShader:ShaderChunk.points_vert,fragmentShader:ShaderChunk.points_frag},dashed:{uniforms:st([UniformsLib.common,UniformsLib.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:ShaderChunk.linedashed_vert,fragmentShader:ShaderChunk.linedashed_frag},depth:{uniforms:st([UniformsLib.common,UniformsLib.displacementmap]),vertexShader:ShaderChunk.depth_vert,fragmentShader:ShaderChunk.depth_frag},normal:{uniforms:st([UniformsLib.common,UniformsLib.bumpmap,UniformsLib.normalmap,UniformsLib.displacementmap,{opacity:{value:1}}]),vertexShader:ShaderChunk.meshnormal_vert,fragmentShader:ShaderChunk.meshnormal_frag},sprite:{uniforms:st([UniformsLib.sprite,UniformsLib.fog]),vertexShader:ShaderChunk.sprite_vert,fragmentShader:ShaderChunk.sprite_frag},background:{uniforms:{uvTransform:{value:new Matrix3},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:ShaderChunk.background_vert,fragmentShader:ShaderChunk.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Matrix3}},vertexShader:ShaderChunk.backgroundCube_vert,fragmentShader:ShaderChunk.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:ShaderChunk.cube_vert,fragmentShader:ShaderChunk.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:ShaderChunk.equirect_vert,fragmentShader:ShaderChunk.equirect_frag},distance:{uniforms:st([UniformsLib.common,UniformsLib.displacementmap,{referencePosition:{value:new Vector3},nearDistance:{value:1},farDistance:{value:1000}}]),vertexShader:ShaderChunk.distance_vert,fragmentShader:ShaderChunk.distance_frag},shadow:{uniforms:st([UniformsLib.lights,UniformsLib.fog,{color:{value:new Color(0)},opacity:{value:1}}]),vertexShader:ShaderChunk.shadow_vert,fragmentShader:ShaderChunk.shadow_frag}};ShaderLib.physical={uniforms:st([ShaderLib.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Matrix3},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Matrix3},clearcoatNormalScale:{value:new Vector2(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Matrix3},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Matrix3},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Matrix3},sheen:{value:0},sheenColor:{value:new Color(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Matrix3},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Matrix3},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Matrix3},transmissionSamplerSize:{value:new Vector2},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Matrix3},attenuationDistance:{value:0},attenuationColor:{value:new Color(0)},specularColor:{value:new Color(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Matrix3},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Matrix3},anisotropyVector:{value:new Vector2},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Matrix3}}]),vertexShader:ShaderChunk.meshphysical_vert,fragmentShader:ShaderChunk.meshphysical_frag};const Lt={r:0,b:0,g:0},La=new Matrix4,rn=new Matrix3;rn.set(-1,0,0,0,1,0,0,0,1);function Ua(e,n,t,i,f,l){const u=new Color(0);let _=f===!0?0:1,F,x,y=null,N=0,h=null;function T(U){let X=U.isScene===!0?U.background:null;if(X&&X.isTexture){const m=U.backgroundBlurriness>0;X=n.get(X,m)}return X}function P(U){let X=!1;const m=T(U);if(m===null)d(u,_);else if(m&&m.isColor){d(m,1);X=!0}const g=e.xr.getEnvironmentBlendMode();if(g==="additive")t.buffers.color.setClear(0,0,0,1,l);else if(g==="alpha-blend")t.buffers.color.setClear(0,0,0,0,l);if(e.autoClear||X){t.buffers.depth.setTest(!0);t.buffers.depth.setMask(!0);t.buffers.color.setMask(!0);e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil)}}function W(U,X){const m=T(X);if(m&&(m.isCubeTexture||m.mapping===CubeUVReflectionMapping)){if(x===void 0){x=new Mesh(new BoxGeometry(1,1,1),new ShaderMaterial({name:"BackgroundCubeMaterial",uniforms:yt(ShaderLib.backgroundCube.uniforms),vertexShader:ShaderLib.backgroundCube.vertexShader,fragmentShader:ShaderLib.backgroundCube.fragmentShader,side:BackSide,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1}));x.geometry.deleteAttribute("normal");x.geometry.deleteAttribute("uv");x.onBeforeRender=function(g,A,L){this.matrixWorld.copyPosition(L.matrixWorld)};Object.defineProperty(x.material,"envMap",{get:function(){return this.uniforms.envMap.value}});i.update(x)}x.material.uniforms.envMap.value=m;x.material.uniforms.backgroundBlurriness.value=X.backgroundBlurriness;x.material.uniforms.backgroundIntensity.value=X.backgroundIntensity;x.material.uniforms.backgroundRotation.value.setFromMatrix4(La.makeRotationFromEuler(X.backgroundRotation)).transpose();if(m.isCubeTexture&&m.isRenderTargetTexture===!1)x.material.uniforms.backgroundRotation.value.premultiply(rn);x.material.toneMapped=ColorManagement.getTransfer(m.colorSpace)!==SRGBTransfer;if(y!==m||N!==m.version||h!==e.toneMapping){x.material.needsUpdate=!0;y=m;N=m.version;h=e.toneMapping}x.layers.enableAll();U.unshift(x,x.geometry,x.material,0,0,null)}else if(m&&m.isTexture){if(F===void 0){F=new Mesh(new PlaneGeometry(2,2),new ShaderMaterial({name:"BackgroundMaterial",uniforms:yt(ShaderLib.background.uniforms),vertexShader:ShaderLib.background.vertexShader,fragmentShader:ShaderLib.background.fragmentShader,side:FrontSide,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1}));F.geometry.deleteAttribute("normal");Object.defineProperty(F.material,"map",{get:function(){return this.uniforms.t2D.value}});i.update(F)}F.material.uniforms.t2D.value=m;F.material.uniforms.backgroundIntensity.value=X.backgroundIntensity;F.material.toneMapped=ColorManagement.getTransfer(m.colorSpace)!==SRGBTransfer;if(m.matrixAutoUpdate===!0)m.updateMatrix();F.material.uniforms.uvTransform.value.copy(m.matrix);if(y!==m||N!==m.version||h!==e.toneMapping){F.material.needsUpdate=!0;y=m;N=m.version;h=e.toneMapping}F.layers.enableAll();U.unshift(F,F.geometry,F.material,0,0,null)}}function d(U,X){U.getRGB(Lt,en(e));t.buffers.color.setClear(Lt.r,Lt.g,Lt.b,X,l)}function o(){if(x!==void 0){x.geometry.dispose();x.material.dispose();x=void 0}if(F!==void 0){F.geometry.dispose();F.material.dispose();F=void 0}}return{getClearColor:function(){return u},setClearColor:function(U,X=1){u.set(U);_=X;d(u,_)},getClearAlpha:function(){return _},setClearAlpha:function(U){_=U;d(u,_)},render:P,addToRenderList:W,dispose:o}}function Da(e,n){const t=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},f=h(null);let l=f,u=!1;function _(D,O,te,C,k){let Q=!1;const G=N(D,C,te,O);if(l!==G){l=G;x(l.object)}Q=T(D,C,te,k);if(Q)P(D,C,te,k);if(k!==null)n.update(k,e.ELEMENT_ARRAY_BUFFER);if(Q||u){u=!1;m(D,O,te,C);if(k!==null)e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,n.get(k).buffer)}}function F(){return e.createVertexArray()}function x(D){return e.bindVertexArray(D)}function y(D){return e.deleteVertexArray(D)}function N(D,O,te,C){const k=C.wireframe===!0;let Q=i[O.id];if(Q===void 0){Q={};i[O.id]=Q}const G=D.isInstancedMesh===!0?D.id:0;let pe=Q[G];if(pe===void 0){pe={};Q[G]=pe}let Y=pe[te.id];if(Y===void 0){Y={};pe[te.id]=Y}let J=Y[k];if(J===void 0){J=h(F());Y[k]=J}return J}function h(D){const O=[],te=[],C=[];for(let k=0;k<t;k++){O[k]=0;te[k]=0;C[k]=0}return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:te,attributeDivisors:C,object:D,attributes:{},index:null}}function T(D,O,te,C){const k=l.attributes,Q=O.attributes;let G=0;const pe=te.getAttributes();for(const Y in pe)if(pe[Y].location>=0){const ee=k[Y];let Pe=Q[Y];if(Pe===void 0){if(Y==="instanceMatrix"&&D.instanceMatrix)Pe=D.instanceMatrix;if(Y==="instanceColor"&&D.instanceColor)Pe=D.instanceColor}if(ee===void 0)return!0;if(ee.attribute!==Pe)return!0;if(Pe&&ee.data!==Pe.data)return!0;G++}if(l.attributesNum!==G)return!0;if(l.index!==C)return!0;return!1}function P(D,O,te,C){const k={},Q=O.attributes;let G=0;const pe=te.getAttributes();for(const Y in pe)if(pe[Y].location>=0){let ee=Q[Y];if(ee===void 0){if(Y==="instanceMatrix"&&D.instanceMatrix)ee=D.instanceMatrix;if(Y==="instanceColor"&&D.instanceColor)ee=D.instanceColor}const Pe={};Pe.attribute=ee;if(ee&&ee.data)Pe.data=ee.data;k[Y]=Pe;G++}l.attributes=k;l.attributesNum=G;l.index=C}function W(){const D=l.newAttributes;for(let O=0,te=D.length;O<te;O++)D[O]=0}function d(D){o(D,0)}function o(D,O){const te=l.newAttributes,C=l.enabledAttributes,k=l.attributeDivisors;te[D]=1;if(C[D]===0){e.enableVertexAttribArray(D);C[D]=1}if(k[D]!==O){e.vertexAttribDivisor(D,O);k[D]=O}}function U(){const D=l.newAttributes,O=l.enabledAttributes;for(let te=0,C=O.length;te<C;te++)if(O[te]!==D[te]){e.disableVertexAttribArray(te);O[te]=0}}function X(D,O,te,C,k,Q,G){if(G===!0)e.vertexAttribIPointer(D,O,te,k,Q);else e.vertexAttribPointer(D,O,te,C,k,Q)}function m(D,O,te,C){W();const k=C.attributes,Q=te.getAttributes(),G=O.defaultAttributeValues;for(const pe in Q){const Y=Q[pe];if(Y.location>=0){let J=k[pe];if(J===void 0){if(pe==="instanceMatrix"&&D.instanceMatrix)J=D.instanceMatrix;if(pe==="instanceColor"&&D.instanceColor)J=D.instanceColor}if(J!==void 0){const ee=J.normalized,Pe=J.itemSize,Ae=n.get(J);if(Ae===void 0)continue;const{buffer:Ze,type:we,bytesPerElement:V}=Ae,ie=we===e.INT||we===e.UNSIGNED_INT||J.gpuType===IntType;if(J.isInterleavedBufferAttribute){const re=J.data,Re=re.stride,be=J.offset;if(re.isInstancedInterleavedBuffer){for(let Te=0;Te<Y.locationSize;Te++)o(Y.location+Te,re.meshPerAttribute);if(D.isInstancedMesh!==!0&&C._maxInstanceCount===void 0)C._maxInstanceCount=re.meshPerAttribute*re.count}else for(let Te=0;Te<Y.locationSize;Te++)d(Y.location+Te);e.bindBuffer(e.ARRAY_BUFFER,Ze);for(let Te=0;Te<Y.locationSize;Te++)X(Y.location+Te,Pe/Y.locationSize,we,ee,Re*V,(be+Pe/Y.locationSize*Te)*V,ie)}else{if(J.isInstancedBufferAttribute){for(let re=0;re<Y.locationSize;re++)o(Y.location+re,J.meshPerAttribute);if(D.isInstancedMesh!==!0&&C._maxInstanceCount===void 0)C._maxInstanceCount=J.meshPerAttribute*J.count}else for(let re=0;re<Y.locationSize;re++)d(Y.location+re);e.bindBuffer(e.ARRAY_BUFFER,Ze);for(let re=0;re<Y.locationSize;re++)X(Y.location+re,Pe/Y.locationSize,we,ee,Pe*V,Pe/Y.locationSize*re*V,ie)}}else if(G!==void 0){const ee=G[pe];if(ee!==void 0)switch(ee.length){case 2:e.vertexAttrib2fv(Y.location,ee);break;case 3:e.vertexAttrib3fv(Y.location,ee);break;case 4:e.vertexAttrib4fv(Y.location,ee);break;default:e.vertexAttrib1fv(Y.location,ee)}}}}U()}function g(){p();for(const D in i){const O=i[D];for(const te in O){const C=O[te];for(const k in C){const Q=C[k];for(const G in Q){y(Q[G].object);delete Q[G]}delete C[k]}}delete i[D]}}function A(D){if(i[D.id]===void 0)return;const O=i[D.id];for(const te in O){const C=O[te];for(const k in C){const Q=C[k];for(const G in Q){y(Q[G].object);delete Q[G]}delete C[k]}}delete i[D.id]}function L(D){for(const O in i){const te=i[O];for(const C in te){const k=te[C];if(k[D.id]===void 0)continue;const Q=k[D.id];for(const G in Q){y(Q[G].object);delete Q[G]}delete k[D.id]}}}function c(D){for(const O in i){const te=i[O],C=D.isInstancedMesh===!0?D.id:0,k=te[C];if(k===void 0)continue;for(const Q in k){const G=k[Q];for(const pe in G){y(G[pe].object);delete G[pe]}delete k[Q]}delete te[C];if(Object.keys(te).length===0)delete i[O]}}function p(){Z();u=!0;if(l===f)return;l=f;x(l.object)}function Z(){f.geometry=null;f.program=null;f.wireframe=!1}return{setup:_,reset:p,resetDefaultState:Z,dispose:g,releaseStatesOfGeometry:A,releaseStatesOfObject:c,releaseStatesOfProgram:L,initAttributes:W,enableAttribute:d,disableUnusedAttributes:U}}function wa(e,n,t){let i;function f(F){i=F}function l(F,x){e.drawArrays(i,F,x);t.update(x,i,1)}function u(F,x,y){if(y===0)return;e.drawArraysInstanced(i,F,x,y);t.update(x,i,y)}function _(F,x,y){if(y===0)return;n.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,F,0,x,0,y);let h=0;for(let T=0;T<y;T++)h+=x[T];t.update(h,i,1)}this.setMode=f;this.render=l;this.renderInstances=u;this.renderMultiDraw=_}function Ia(e,n,t,i){let f;function l(){if(f!==void 0)return f;if(n.has("EXT_texture_filter_anisotropic")===!0){const L=n.get("EXT_texture_filter_anisotropic");f=e.getParameter(L.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else f=0;return f}function u(L){if(L!==RGBAFormat&&i.convert(L)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))return!1;return!0}function _(L){const c=L===HalfFloatType&&(n.has("EXT_color_buffer_half_float")||n.has("EXT_color_buffer_float"));if(L!==UnsignedByteType&&L!==FloatType&&!c&&i.convert(L)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))return!1;return!0}function F(L){if(L==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";L="mediump"}if(L==="mediump"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0)return"mediump"}return"lowp"}let x=t.precision!==void 0?t.precision:"highp";const y=F(x);if(y!==x){warn("WebGLRenderer:",x,"not supported, using",y,"instead.");x=y}const N=t.logarithmicDepthBuffer===!0,h=t.reversedDepthBuffer===!0&&n.has("EXT_clip_control");if(t.reversedDepthBuffer===!0&&h===!1)warn("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const T=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),P=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),W=e.getParameter(e.MAX_TEXTURE_SIZE),d=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),o=e.getParameter(e.MAX_VERTEX_ATTRIBS),U=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),X=e.getParameter(e.MAX_VARYING_VECTORS),m=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),g=e.getParameter(e.MAX_SAMPLES),A=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:l,getMaxPrecision:F,textureFormatReadable:u,textureTypeReadable:_,precision:x,logarithmicDepthBuffer:N,reversedDepthBuffer:h,maxTextures:T,maxVertexTextures:P,maxTextureSize:W,maxCubemapSize:d,maxAttributes:o,maxVertexUniforms:U,maxVaryings:X,maxFragmentUniforms:m,maxSamples:g,samples:A}}function Na(e){const n=this;let t=null,i=0,f=!1,l=!1;const u=new Plane,_=new Matrix3,F={value:null,needsUpdate:!1};this.uniform=F;this.numPlanes=0;this.numIntersection=0;this.init=function(N,h){const T=N.length!==0||h||i!==0||f;f=h;i=N.length;return T};this.beginShadows=function(){l=!0;y(null)};this.endShadows=function(){l=!1};this.setGlobalState=function(N,h){t=y(N,h,0)};this.setState=function(N,h,T){const{clippingPlanes:P,clipIntersection:W,clipShadows:d}=N,o=e.get(N);if(!f||P===null||P.length===0||l&&!d)if(l)y(null);else x();else{const U=l?0:i,X=U*4;let m=o.clippingState||null;F.value=m;m=y(P,h,X,T);for(let g=0;g!==X;++g)m[g]=t[g];o.clippingState=m;this.numIntersection=W?this.numPlanes:0;this.numPlanes+=U}};function x(){if(F.value!==t){F.value=t;F.needsUpdate=i>0}n.numPlanes=i;n.numIntersection=0}function y(N,h,T,P){const W=N!==null?N.length:0;let d=null;if(W!==0){d=F.value;if(P!==!0||d===null){const o=T+W*4,U=h.matrixWorldInverse;_.getNormalMatrix(U);if(d===null||d.length<o)d=new Float32Array(o);for(let X=0,m=T;X!==W;++X,m+=4){u.copy(N[X]).applyMatrix4(U,_);u.normal.toArray(d,m);d[m+3]=u.constant}}F.value=d;F.needsUpdate=!0}n.numPlanes=W;n.numIntersection=0;return d}}const Et=4,ya=6,Fa=20,Oa=256,Tt=new OrthographicCamera,an=new Color;let Ft=null,Ot=0,Bt=0,Gt=!1;const Ba=new Vector3,gt=new Vector3;class PMREMGenerator{constructor(e){this._renderer=e;this._pingPongRenderTarget=null;this._lodMax=0;this._cubeSize=0;this._sizeLods=[];this._lodMeshes=[];this._backgroundBox=null;this._cubemapMaterial=null;this._equirectMaterial=null;this._blurMaterial=null;this._ggxMaterial=null}fromScene(e,n=0,t=0.1,i=100,f={}){const{size:l=256,position:u=Ba}=f;Ft=this._renderer.getRenderTarget();Ot=this._renderer.getActiveCubeFace();Bt=this._renderer.getActiveMipmapLevel();Gt=this._renderer.xr.enabled;this._renderer.xr.enabled=!1;this._setSize(l);const _=this._allocateTargets();_.depthBuffer=!0;this._sceneToCubeUV(e,t,i,_,u);if(n>0)this._blur(_,0,0,n);this._applyPMREM(_);this._cleanup(_);return _}fromEquirectangular(e,n=null){return this._fromTexture(e,n)}fromCubemap(e,n=null){return this._fromTexture(e,n)}compileCubemapShader(){if(this._cubemapMaterial===null){this._cubemapMaterial=ln();this._compileMaterial(this._cubemapMaterial)}}compileEquirectangularShader(){if(this._equirectMaterial===null){this._equirectMaterial=sn();this._compileMaterial(this._equirectMaterial)}}dispose(){this._dispose();if(this._cubemapMaterial!==null)this._cubemapMaterial.dispose();if(this._equirectMaterial!==null)this._equirectMaterial.dispose();if(this._backgroundBox!==null){this._backgroundBox.geometry.dispose();this._backgroundBox.material.dispose()}}_setSize(e){this._lodMax=Math.floor(Math.log2(e));this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){if(this._blurMaterial!==null)this._blurMaterial.dispose();if(this._ggxMaterial!==null)this._ggxMaterial.dispose();if(this._pingPongRenderTarget!==null)this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Ft,Ot,Bt);this._renderer.xr.enabled=Gt;e.scissorTest=!1;Mt(e,0,0,e.width,e.height)}_fromTexture(e,n){if(e.mapping===CubeReflectionMapping||e.mapping===CubeRefractionMapping)this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width);else this._setSize(e.image.width/4);Ft=this._renderer.getRenderTarget();Ot=this._renderer.getActiveCubeFace();Bt=this._renderer.getActiveMipmapLevel();Gt=this._renderer.xr.enabled;this._renderer.xr.enabled=!1;const t=n||this._allocateTargets();this._textureToCubeUV(e,t);this._applyPMREM(t);this._cleanup(t);return t}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),n=4*this._cubeSize,t={magFilter:LinearFilter,minFilter:LinearFilter,generateMipmaps:!1,type:HalfFloatType,format:RGBAFormat,colorSpace:LinearSRGBColorSpace,depthBuffer:!1},i=on(e,n,t);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==n){if(this._pingPongRenderTarget!==null)this._dispose();this._pingPongRenderTarget=on(e,n,t);const{_lodMax:f}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Ga(f));this._blurMaterial=Va(f,e,n);this._ggxMaterial=Ha(f,e,n)}return i}_compileMaterial(e){const n=new Mesh(new BufferGeometry,e);this._renderer.compile(n,Tt)}_sceneToCubeUV(e,n,t,i,f){const _=new PerspectiveCamera(90,1,n,t),F=[1,-1,1,1,1,1],x=[1,1,1,-1,-1,-1],y=this._renderer,{autoClear:N,toneMapping:h}=y;y.getClearColor(an);y.toneMapping=NoToneMapping;y.autoClear=!1;if(y.state.buffers.depth.getReversed()){y.setRenderTarget(i);y.clearDepth();y.setRenderTarget(null)}if(this._backgroundBox===null)this._backgroundBox=new Mesh(new BoxGeometry,new MeshBasicMaterial({name:"PMREM.Background",side:BackSide,depthWrite:!1,depthTest:!1}));const P=this._backgroundBox,W=P.material;let d=!1;const o=e.background;if(o){if(o.isColor){W.color.copy(o);e.background=null;d=!0}}else{W.color.copy(an);d=!0}for(let U=0;U<6;U++){const X=U%3;if(X===0){_.up.set(0,F[U],0);_.position.set(f.x,f.y,f.z);_.lookAt(f.x+x[U],f.y,f.z)}else if(X===1){_.up.set(0,0,F[U]);_.position.set(f.x,f.y,f.z);_.lookAt(f.x,f.y+x[U],f.z)}else{_.up.set(0,F[U],0);_.position.set(f.x,f.y,f.z);_.lookAt(f.x,f.y,f.z+x[U])}const m=this._cubeSize;Mt(i,X*m,U>2?m:0,m,m);y.setRenderTarget(i);if(d)y.render(P,_);y.render(e,_)}y.toneMapping=h;y.autoClear=N;e.background=o}_textureToCubeUV(e,n){const t=this._renderer,i=e.mapping===CubeReflectionMapping||e.mapping===CubeRefractionMapping;if(i){if(this._cubemapMaterial===null)this._cubemapMaterial=ln();this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1}else if(this._equirectMaterial===null)this._equirectMaterial=sn();const f=i?this._cubemapMaterial:this._equirectMaterial,l=this._lodMeshes[0];l.material=f;const u=f.uniforms;u.envMap.value=e;const _=this._cubeSize;Mt(n,0,0,3*_,2*_);t.setRenderTarget(n);t.render(l,Tt)}_applyPMREM(e){const n=this._renderer,t=n.autoClear;n.autoClear=!1;const i=this._lodMeshes.length;for(let f=1;f<i;f++)this._applyGGXFilter(e,f-1,f);n.autoClear=t}_applyGGXFilter(e,n,t){const i=this._renderer,f=this._pingPongRenderTarget,l=this._ggxMaterial,u=this._lodMeshes[t];u.material=l;const _=l.uniforms,F=t/(this._lodMeshes.length-1),x=n/(this._lodMeshes.length-1),y=Math.sqrt(F*F-x*x),N=F*1.25,h=y*N,{_lodMax:T}=this,P=this._sizeLods[t],W=3*P*(t>T-Et?t-T+Et:0),d=4*(this._cubeSize-P);_.envMap.value=e.texture;_.roughness.value=h;_.mipInt.value=T-n;Mt(f,W,d,3*P,2*P);i.setRenderTarget(f);i.render(u,Tt);_.envMap.value=f.texture;_.roughness.value=0;_.mipInt.value=T-t;Mt(e,W,d,3*P,2*P);i.setRenderTarget(e);i.render(u,Tt)}_blur(e,n,t,i){const f=this._pingPongRenderTarget,l=Math.min(i,Math.PI)/Math.SQRT2;this._blurPass(e,f,n,t,l);this._blurPass(f,e,t,t,l)}_blurPass(e,n,t,i,f){const l=this._renderer,u=this._blurMaterial,_=this._lodMeshes[i];_.material=u;const F=u.uniforms;F.envMap.value=e.texture;F.sigma.value=f;F.mipInt.value=this._lodMax-t;const x=this._sizeLods[i],y=3*x*(i>this._lodMax-Et?i-this._lodMax+Et:0),N=4*(this._cubeSize-x);Mt(n,y,N,3*x,2*x);l.setRenderTarget(n);l.render(_,Tt)}}function Ga(e){const n=[],t=[];let i=e;const f=e-Et+1+ya;for(let l=0;l<f;l++){const u=Math.pow(2,i);n.push(u);const _=1/(u-2),F=-_,x=1+_,y=[F,F,x,F,x,x,F,F,x,x,F,x],N=6,h=6,T=3,P=new Float32Array(T*h*N),W=new Float32Array(T*h*N);for(let o=0;o<N;o++){const U=o%3*2/3-1,X=o>2?0:-1,m=[U,X,0,U+0.6666666666666666,X,0,U+0.6666666666666666,X+1,0,U,X,0,U+0.6666666666666666,X+1,0,U,X+1,0];P.set(m,T*h*o);for(let g=0;g<h;g++){const A=y[g*2]*2-1,L=y[g*2+1]*2-1;if(o===0)gt.set(1,L,A);else if(o===1)gt.set(-A,1,-L);else if(o===2)gt.set(-A,L,1);else if(o===3)gt.set(-1,L,-A);else if(o===4)gt.set(-A,-1,L);else gt.set(A,L,-1);gt.toArray(W,(o*h+g)*T)}}const d=new BufferGeometry;d.setAttribute("position",new BufferAttribute(P,T));d.setAttribute("outputDirection",new BufferAttribute(W,T));t.push(new Mesh(d,null));if(i>Et)i--}return{lodMeshes:t,sizeLods:n}}function on(e,n,t){const i=new WebGLRenderTarget(e,n,t);i.texture.mapping=CubeUVReflectionMapping;i.texture.name="PMREM.cubeUv";i.scissorTest=!0;return i}function Mt(e,n,t,i,f){e.viewport.set(n,t,i,f);e.scissor.set(n,t,i,f)}function Ha(e,n,t){return new ShaderMaterial({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Oa,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Ut(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:NoBlending,depthTest:!1,depthWrite:!1})}function Va(e,n,t){return new ShaderMaterial({name:"SphericalGaussianBlur",defines:{SAMPLES:Fa,CUBEUV_TEXEL_WIDTH:1/n,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Ut(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:NoBlending,depthTest:!1,depthWrite:!1})}function sn(){return new ShaderMaterial({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ut(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:NoBlending,depthTest:!1,depthWrite:!1})}function ln(){return new ShaderMaterial({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ut(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:NoBlending,depthTest:!1,depthWrite:!1})}function Ut(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class WebGLCubeRenderTarget extends WebGLRenderTarget{constructor(e=1,n={}){super(e,e,n);this.isWebGLCubeRenderTarget=!0;const t={width:e,height:e,depth:1},i=[t,t,t,t,t,t];this.texture=new CubeTexture(i);this._setTextureOptions(n);this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,n){this.texture.type=n.type;this.texture.colorSpace=n.colorSpace;this.texture.generateMipmaps=n.generateMipmaps;this.texture.minFilter=n.minFilter;this.texture.magFilter=n.magFilter;const t={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new BoxGeometry(5,5,5),f=new ShaderMaterial({name:"CubemapFromEquirect",uniforms:yt(t.uniforms),vertexShader:t.vertexShader,fragmentShader:t.fragmentShader,side:BackSide,blending:NoBlending});f.uniforms.tEquirect.value=n;const l=new Mesh(i,f),u=n.minFilter;if(n.minFilter===LinearMipmapLinearFilter)n.minFilter=LinearFilter;new CubeCamera(1,10,this).update(e,l);n.minFilter=u;l.geometry.dispose();l.material.dispose();return this}clear(e,n=!0,t=!0,i=!0){const f=e.getRenderTarget();for(let l=0;l<6;l++){e.setRenderTarget(this,l);e.clear(n,t,i)}e.setRenderTarget(f)}}function Wa(e){let n=new WeakMap,t=new WeakMap,i=null;function f(h,T=!1){if(h===null||h===void 0)return null;if(T)return u(h);return l(h)}function l(h){if(h&&h.isTexture){const T=h.mapping;if(T===EquirectangularReflectionMapping||T===EquirectangularRefractionMapping)if(n.has(h)){const P=n.get(h).texture;return _(P,h.mapping)}else{const P=h.image;if(P&&P.height>0){const W=new WebGLCubeRenderTarget(P.height);W.fromEquirectangularTexture(e,h);n.set(h,W);h.addEventListener("dispose",x);return _(W.texture,h.mapping)}else return null}}return h}function u(h){if(h&&h.isTexture){const T=h.mapping,P=T===EquirectangularReflectionMapping||T===EquirectangularRefractionMapping,W=T===CubeReflectionMapping||T===CubeRefractionMapping;if(P||W){let d=t.get(h);const o=d!==void 0?d.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==o){if(i===null)i=new PMREMGenerator(e);d=P?i.fromEquirectangular(h,d):i.fromCubemap(h,d);d.texture.pmremVersion=h.pmremVersion;t.set(h,d);return d.texture}else if(d!==void 0)return d.texture;else{const U=h.image;if(P&&U&&U.height>0||W&&U&&F(U)){if(i===null)i=new PMREMGenerator(e);d=P?i.fromEquirectangular(h):i.fromCubemap(h);d.texture.pmremVersion=h.pmremVersion;t.set(h,d);h.addEventListener("dispose",y);return d.texture}else return null}}}return h}function _(h,T){if(T===EquirectangularReflectionMapping)h.mapping=CubeReflectionMapping;else if(T===EquirectangularRefractionMapping)h.mapping=CubeRefractionMapping;return h}function F(h){let T=0;const P=6;for(let W=0;W<P;W++)if(h[W]!==void 0)T++;return T===P}function x(h){const T=h.target;T.removeEventListener("dispose",x);const P=n.get(T);if(P!==void 0){n.delete(T);P.dispose()}}function y(h){const T=h.target;T.removeEventListener("dispose",y);const P=t.get(T);if(P!==void 0){t.delete(T);P.dispose()}}function N(){n=new WeakMap;t=new WeakMap;if(i!==null){i.dispose();i=null}}return{get:f,dispose:N}}function ka(e){const n={};function t(i){if(n[i]!==void 0)return n[i];const f=e.getExtension(i);n[i]=f;return f}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float");t("WEBGL_clip_cull_distance");t("OES_texture_float_linear");t("EXT_color_buffer_half_float");t("WEBGL_multisampled_render_to_texture");t("WEBGL_render_shared_exponent")},get:function(i){const f=t(i);if(f===null)warnOnce("WebGLRenderer: "+i+" extension not supported.");return f}}}function za(e,n,t,i){const f={},l=new WeakMap;function u(N){const h=N.target;if(h.index!==null)n.remove(h.index);for(const P in h.attributes)n.remove(h.attributes[P]);h.removeEventListener("dispose",u);delete f[h.id];const T=l.get(h);if(T){n.remove(T);l.delete(h)}i.releaseStatesOfGeometry(h);if(h.isInstancedBufferGeometry===!0)delete h._maxInstanceCount;t.memory.geometries--}function _(N,h){if(f[h.id]===!0)return h;h.addEventListener("dispose",u);f[h.id]=!0;t.memory.geometries++;return h}function F(N){const h=N.attributes;for(const T in h)n.update(h[T],e.ARRAY_BUFFER)}function x(N){const h=[],T=N.index,P=N.attributes.position;let W=0;if(P===void 0)return;if(T!==null){const U=T.array;W=T.version;for(let X=0,m=U.length;X<m;X+=3){const g=U[X+0],A=U[X+1],L=U[X+2];h.push(g,A,A,L,L,g)}}else{const U=P.array;W=P.version;for(let X=0,m=U.length/3-1;X<m;X+=3){const g=X+0,A=X+1,L=X+2;h.push(g,A,A,L,L,g)}}const d=new(P.count>=65535?Uint32BufferAttribute:Uint16BufferAttribute)(h,1);d.version=W;const o=l.get(N);if(o)n.remove(o);l.set(N,d)}function y(N){const h=l.get(N);if(h){const T=N.index;if(T!==null){if(h.version<T.version)x(N)}}else x(N);return l.get(N)}return{get:_,update:F,getWireframeAttribute:y}}function Xa(e,n,t){let i;function f(N){i=N}let l,u;function _(N){l=N.type;u=N.bytesPerElement}function F(N,h){e.drawElements(i,h,l,N*u);t.update(h,i,1)}function x(N,h,T){if(T===0)return;e.drawElementsInstanced(i,h,l,N*u,T);t.update(h,i,T)}function y(N,h,T){if(T===0)return;n.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,h,0,l,N,0,T);let W=0;for(let d=0;d<T;d++)W+=h[d];t.update(W,i,1)}this.setMode=f;this.setIndex=_;this.render=F;this.renderInstances=x;this.renderMultiDraw=y}function Ka(e){const n={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(l,u,_){t.calls++;switch(u){case e.TRIANGLES:t.triangles+=_*(l/3);break;case e.LINES:t.lines+=_*(l/2);break;case e.LINE_STRIP:t.lines+=_*(l-1);break;case e.LINE_LOOP:t.lines+=_*l;break;case e.POINTS:t.points+=_*l;break;default:error("WebGLInfo: Unknown draw mode:",u);break}}function f(){t.calls=0;t.triangles=0;t.points=0;t.lines=0}return{memory:n,render:t,programs:null,autoReset:!0,reset:f,update:i}}function Ya(e,n,t){const i=new WeakMap,f=new Vector4;function l(u,_,F){const x=u.morphTargetInfluences,y=_.morphAttributes.position||_.morphAttributes.normal||_.morphAttributes.color,N=y!==void 0?y.length:0;let h=i.get(_);if(h===void 0||h.count!==N){let p=function(){L.dispose();i.delete(_);_.removeEventListener("dispose",p)};if(h!==void 0)h.texture.dispose();const T=_.morphAttributes.position!==void 0,P=_.morphAttributes.normal!==void 0,W=_.morphAttributes.color!==void 0,d=_.morphAttributes.position||[],o=_.morphAttributes.normal||[],U=_.morphAttributes.color||[];let X=0;if(T===!0)X=1;if(P===!0)X=2;if(W===!0)X=3;let m=_.attributes.position.count*X,g=1;if(m>n.maxTextureSize){g=Math.ceil(m/n.maxTextureSize);m=n.maxTextureSize}const A=new Float32Array(m*g*4*N),L=new DataArrayTexture(A,m,g,N);L.type=FloatType;L.needsUpdate=!0;const c=X*4;for(let Z=0;Z<N;Z++){const D=d[Z],O=o[Z],te=U[Z],C=m*g*4*Z;for(let k=0;k<D.count;k++){const Q=k*c;if(T===!0){f.fromBufferAttribute(D,k);A[C+Q+0]=f.x;A[C+Q+1]=f.y;A[C+Q+2]=f.z;A[C+Q+3]=0}if(P===!0){f.fromBufferAttribute(O,k);A[C+Q+4]=f.x;A[C+Q+5]=f.y;A[C+Q+6]=f.z;A[C+Q+7]=0}if(W===!0){f.fromBufferAttribute(te,k);A[C+Q+8]=f.x;A[C+Q+9]=f.y;A[C+Q+10]=f.z;A[C+Q+11]=te.itemSize===4?f.w:1}}}h={count:N,texture:L,size:new Vector2(m,g)};i.set(_,h);_.addEventListener("dispose",p)}if(u.isInstancedMesh===!0&&u.morphTexture!==null)F.getUniforms().setValue(e,"morphTexture",u.morphTexture,t);else{let T=0;for(let W=0;W<x.length;W++)T+=x[W];const P=_.morphTargetsRelative?1:1-T;F.getUniforms().setValue(e,"morphTargetBaseInfluence",P);F.getUniforms().setValue(e,"morphTargetInfluences",x)}F.getUniforms().setValue(e,"morphTargetsTexture",h.texture,t);F.getUniforms().setValue(e,"morphTargetsTextureSize",h.size)}return{update:l}}function qa(e,n,t,i,f){let l=new WeakMap;function u(x){const y=f.render.frame,N=x.geometry,h=n.get(x,N);if(l.get(h)!==y){n.update(h);l.set(h,y)}if(x.isInstancedMesh){if(x.hasEventListener("dispose",F)===!1)x.addEventListener("dispose",F);if(l.get(x)!==y){t.update(x.instanceMatrix,e.ARRAY_BUFFER);if(x.instanceColor!==null)t.update(x.instanceColor,e.ARRAY_BUFFER);l.set(x,y)}}if(x.isSkinnedMesh){const T=x.skeleton;if(l.get(T)!==y){T.update();l.set(T,y)}}return h}function _(){l=new WeakMap}function F(x){const y=x.target;y.removeEventListener("dispose",F);i.releaseStatesOfObject(y);t.remove(y.instanceMatrix);if(y.instanceColor!==null)t.remove(y.instanceColor)}return{update:u,dispose:_}}const Za={[LinearToneMapping]:"LINEAR_TONE_MAPPING",[ReinhardToneMapping]:"REINHARD_TONE_MAPPING",[CineonToneMapping]:"CINEON_TONE_MAPPING",[ACESFilmicToneMapping]:"ACES_FILMIC_TONE_MAPPING",[AgXToneMapping]:"AGX_TONE_MAPPING",[NeutralToneMapping]:"NEUTRAL_TONE_MAPPING",[CustomToneMapping]:"CUSTOM_TONE_MAPPING"};function $a(e,n,t,i,f,l){const u=new WebGLRenderTarget(n,t,{type:e,depthBuffer:f,stencilBuffer:l,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let _=null,F=null;const x=new BufferGeometry;x.setAttribute("position",new Float32BufferAttribute([-1,3,0,-1,-1,0,3,-1,0],3));x.setAttribute("uv",new Float32BufferAttribute([0,2,0,0,2,0],2));const y=new RawShaderMaterial({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),N=new Mesh(x,y),h=new OrthographicCamera(-1,1,1,-1,0,1);let T=null,P=null,W=!1,d,o=null,U=[],X=!1;this.setSize=function(m,g){u.setSize(m,g);if(_!==null)_.setSize(m,g);if(F!==null)F.setSize(m,g);for(let A=0;A<U.length;A++){const L=U[A];if(L.setSize)L.setSize(m,g)}};this.setEffects=function(m){U=m;X=U.length>0&&U[0].isRenderPass===!0;const{width:g,height:A}=u;if(U.length>0&&_===null){_=new WebGLRenderTarget(g,A,{type:HalfFloatType,depthBuffer:!1,stencilBuffer:!1});F=new WebGLRenderTarget(g,A,{type:HalfFloatType,depthBuffer:!1,stencilBuffer:!1})}for(let L=0;L<U.length;L++){const c=U[L];if(c.setSize)c.setSize(g,A)}};this.begin=function(m,g){if(W)return!1;if(m.toneMapping===NoToneMapping&&U.length===0)return!1;o=g;if(g!==null){const{width:A,height:L}=g;if(u.width!==A||u.height!==L)this.setSize(A,L)}if(X===!1)m.setRenderTarget(u);d=m.toneMapping;m.toneMapping=NoToneMapping;return!0};this.hasRenderPass=function(){return X};this.end=function(m,g){m.toneMapping=d;W=!0;let A=u,L=_;for(let c=0;c<U.length;c++){const p=U[c];if(p.enabled===!1)continue;p.render(m,L,A,g);if(p.needsSwap!==!1){A=L;L=L===_?F:_}}if(T!==m.outputColorSpace||P!==m.toneMapping){T=m.outputColorSpace;P=m.toneMapping;y.defines={};if(ColorManagement.getTransfer(T)===SRGBTransfer)y.defines.SRGB_TRANSFER="";const c=Za[P];if(c)y.defines[c]="";y.needsUpdate=!0}y.uniforms.tDiffuse.value=A.texture;m.setRenderTarget(o);m.render(N,h);o=null;W=!1};this.isCompositing=function(){return W};this.dispose=function(){u.dispose();if(_!==null)_.dispose();if(F!==null)F.dispose();x.dispose();y.dispose()}}const cn=new Texture,Ht=new DepthTexture(1,1),fn=new DataArrayTexture,dn=new Data3DTexture,un=new CubeTexture,pn=[],hn=[],mn=new Float32Array(16),_n=new Float32Array(9),gn=new Float32Array(4);function xt(e,n,t){const i=e[0];if(i<=0||i>0)return e;const f=n*t;let l=pn[f];if(l===void 0){l=new Float32Array(f);pn[f]=l}if(n!==0){i.toArray(l,0);for(let u=1,_=0;u!==n;++u){_+=t;e[u].toArray(l,_)}}return l}function et(e,n){if(e.length!==n.length)return!1;for(let t=0,i=e.length;t<i;t++)if(e[t]!==n[t])return!1;return!0}function tt(e,n){for(let t=0,i=n.length;t<i;t++)e[t]=n[t]}function Dt(e,n){let t=hn[n];if(t===void 0){t=new Int32Array(n);hn[n]=t}for(let i=0;i!==n;++i)t[i]=e.allocateTextureUnit();return t}function Qa(e,n){const t=this.cache;if(t[0]===n)return;e.uniform1f(this.addr,n);t[0]=n}function Ja(e,n){const t=this.cache;if(n.x!==void 0){if(t[0]!==n.x||t[1]!==n.y){e.uniform2f(this.addr,n.x,n.y);t[0]=n.x;t[1]=n.y}}else{if(et(t,n))return;e.uniform2fv(this.addr,n);tt(t,n)}}function ja(e,n){const t=this.cache;if(n.x!==void 0){if(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z){e.uniform3f(this.addr,n.x,n.y,n.z);t[0]=n.x;t[1]=n.y;t[2]=n.z}}else if(n.r!==void 0){if(t[0]!==n.r||t[1]!==n.g||t[2]!==n.b){e.uniform3f(this.addr,n.r,n.g,n.b);t[0]=n.r;t[1]=n.g;t[2]=n.b}}else{if(et(t,n))return;e.uniform3fv(this.addr,n);tt(t,n)}}function eo(e,n){const t=this.cache;if(n.x!==void 0){if(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w){e.uniform4f(this.addr,n.x,n.y,n.z,n.w);t[0]=n.x;t[1]=n.y;t[2]=n.z;t[3]=n.w}}else{if(et(t,n))return;e.uniform4fv(this.addr,n);tt(t,n)}}function to(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(et(t,n))return;e.uniformMatrix2fv(this.addr,!1,n);tt(t,n)}else{if(et(t,i))return;gn.set(i);e.uniformMatrix2fv(this.addr,!1,gn);tt(t,i)}}function no(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(et(t,n))return;e.uniformMatrix3fv(this.addr,!1,n);tt(t,n)}else{if(et(t,i))return;_n.set(i);e.uniformMatrix3fv(this.addr,!1,_n);tt(t,i)}}function io(e,n){const t=this.cache,i=n.elements;if(i===void 0){if(et(t,n))return;e.uniformMatrix4fv(this.addr,!1,n);tt(t,n)}else{if(et(t,i))return;mn.set(i);e.uniformMatrix4fv(this.addr,!1,mn);tt(t,i)}}function ro(e,n){const t=this.cache;if(t[0]===n)return;e.uniform1i(this.addr,n);t[0]=n}function ao(e,n){const t=this.cache;if(n.x!==void 0){if(t[0]!==n.x||t[1]!==n.y){e.uniform2i(this.addr,n.x,n.y);t[0]=n.x;t[1]=n.y}}else{if(et(t,n))return;e.uniform2iv(this.addr,n);tt(t,n)}}function oo(e,n){const t=this.cache;if(n.x!==void 0){if(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z){e.uniform3i(this.addr,n.x,n.y,n.z);t[0]=n.x;t[1]=n.y;t[2]=n.z}}else{if(et(t,n))return;e.uniform3iv(this.addr,n);tt(t,n)}}function so(e,n){const t=this.cache;if(n.x!==void 0){if(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w){e.uniform4i(this.addr,n.x,n.y,n.z,n.w);t[0]=n.x;t[1]=n.y;t[2]=n.z;t[3]=n.w}}else{if(et(t,n))return;e.uniform4iv(this.addr,n);tt(t,n)}}function lo(e,n){const t=this.cache;if(t[0]===n)return;e.uniform1ui(this.addr,n);t[0]=n}function co(e,n){const t=this.cache;if(n.x!==void 0){if(t[0]!==n.x||t[1]!==n.y){e.uniform2ui(this.addr,n.x,n.y);t[0]=n.x;t[1]=n.y}}else{if(et(t,n))return;e.uniform2uiv(this.addr,n);tt(t,n)}}function fo(e,n){const t=this.cache;if(n.x!==void 0){if(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z){e.uniform3ui(this.addr,n.x,n.y,n.z);t[0]=n.x;t[1]=n.y;t[2]=n.z}}else{if(et(t,n))return;e.uniform3uiv(this.addr,n);tt(t,n)}}function uo(e,n){const t=this.cache;if(n.x!==void 0){if(t[0]!==n.x||t[1]!==n.y||t[2]!==n.z||t[3]!==n.w){e.uniform4ui(this.addr,n.x,n.y,n.z,n.w);t[0]=n.x;t[1]=n.y;t[2]=n.z;t[3]=n.w}}else{if(et(t,n))return;e.uniform4uiv(this.addr,n);tt(t,n)}}function po(e,n,t){const i=this.cache,f=t.allocateTextureUnit();if(i[0]!==f){e.uniform1i(this.addr,f);i[0]=f}let l;if(this.type===e.SAMPLER_2D_SHADOW){Ht.compareFunction=t.isReversedDepthBuffer()?GreaterEqualCompare:LessEqualCompare;l=Ht}else l=cn;t.setTexture2D(n||l,f)}function ho(e,n,t){const i=this.cache,f=t.allocateTextureUnit();if(i[0]!==f){e.uniform1i(this.addr,f);i[0]=f}t.setTexture3D(n||dn,f)}function mo(e,n,t){const i=this.cache,f=t.allocateTextureUnit();if(i[0]!==f){e.uniform1i(this.addr,f);i[0]=f}t.setTextureCube(n||un,f)}function _o(e,n,t){const i=this.cache,f=t.allocateTextureUnit();if(i[0]!==f){e.uniform1i(this.addr,f);i[0]=f}t.setTexture2DArray(n||fn,f)}function go(e){switch(e){case 5126:return Qa;case 35664:return Ja;case 35665:return ja;case 35666:return eo;case 35674:return to;case 35675:return no;case 35676:return io;case 5124:case 35670:return ro;case 35667:case 35671:return ao;case 35668:case 35672:return oo;case 35669:case 35673:return so;case 5125:return lo;case 36294:return co;case 36295:return fo;case 36296:return uo;case 35678:case 36198:case 36298:case 36306:case 35682:return po;case 35679:case 36299:case 36307:return ho;case 35680:case 36300:case 36308:case 36293:return mo;case 36289:case 36303:case 36311:case 36292:return _o}}function vo(e,n){e.uniform1fv(this.addr,n)}function So(e,n){const t=xt(n,this.size,2);e.uniform2fv(this.addr,t)}function Eo(e,n){const t=xt(n,this.size,3);e.uniform3fv(this.addr,t)}function Mo(e,n){const t=xt(n,this.size,4);e.uniform4fv(this.addr,t)}function xo(e,n){const t=xt(n,this.size,4);e.uniformMatrix2fv(this.addr,!1,t)}function To(e,n){const t=xt(n,this.size,9);e.uniformMatrix3fv(this.addr,!1,t)}function Ao(e,n){const t=xt(n,this.size,16);e.uniformMatrix4fv(this.addr,!1,t)}function Ro(e,n){e.uniform1iv(this.addr,n)}function bo(e,n){e.uniform2iv(this.addr,n)}function Co(e,n){e.uniform3iv(this.addr,n)}function Po(e,n){e.uniform4iv(this.addr,n)}function Lo(e,n){e.uniform1uiv(this.addr,n)}function Uo(e,n){e.uniform2uiv(this.addr,n)}function Do(e,n){e.uniform3uiv(this.addr,n)}function wo(e,n){e.uniform4uiv(this.addr,n)}function Io(e,n,t){const i=this.cache,f=n.length,l=Dt(t,f);if(!et(i,l)){e.uniform1iv(this.addr,l);tt(i,l)}let u;if(this.type===e.SAMPLER_2D_SHADOW)u=Ht;else u=cn;for(let _=0;_!==f;++_)t.setTexture2D(n[_]||u,l[_])}function No(e,n,t){const i=this.cache,f=n.length,l=Dt(t,f);if(!et(i,l)){e.uniform1iv(this.addr,l);tt(i,l)}for(let u=0;u!==f;++u)t.setTexture3D(n[u]||dn,l[u])}function yo(e,n,t){const i=this.cache,f=n.length,l=Dt(t,f);if(!et(i,l)){e.uniform1iv(this.addr,l);tt(i,l)}for(let u=0;u!==f;++u)t.setTextureCube(n[u]||un,l[u])}function Fo(e,n,t){const i=this.cache,f=n.length,l=Dt(t,f);if(!et(i,l)){e.uniform1iv(this.addr,l);tt(i,l)}for(let u=0;u!==f;++u)t.setTexture2DArray(n[u]||fn,l[u])}function Oo(e){switch(e){case 5126:return vo;case 35664:return So;case 35665:return Eo;case 35666:return Mo;case 35674:return xo;case 35675:return To;case 35676:return Ao;case 5124:case 35670:return Ro;case 35667:case 35671:return bo;case 35668:case 35672:return Co;case 35669:case 35673:return Po;case 5125:return Lo;case 36294:return Uo;case 36295:return Do;case 36296:return wo;case 35678:case 36198:case 36298:case 36306:case 35682:return Io;case 35679:case 36299:case 36307:return No;case 35680:case 36300:case 36308:case 36293:return yo;case 36289:case 36303:case 36311:case 36292:return Fo}}class Dn{constructor(e,n,t){this.id=e;this.addr=t;this.cache=[];this.type=n.type;this.setValue=go(n.type)}}class wn{constructor(e,n,t){this.id=e;this.addr=t;this.cache=[];this.type=n.type;this.size=n.size;this.setValue=Oo(n.type)}}class In{constructor(e){this.id=e;this.seq=[];this.map={}}setValue(e,n,t){const i=this.seq;for(let f=0,l=i.length;f!==l;++f){const u=i[f];u.setValue(e,n[u.id],t)}}}const Vt=/(\w+)(\])?(\[|\.)?/g;function vn(e,n){e.seq.push(n);e.map[n.id]=n}function Bo(e,n,t){const i=e.name,f=i.length;Vt.lastIndex=0;while(!0){const l=Vt.exec(i),u=Vt.lastIndex;let _=l[1];const F=l[2]==="]",x=l[3];if(F)_=_|0;if(x===void 0||x==="["&&u+2===f){vn(t,x===void 0?new Dn(_,e,n):new wn(_,e,n));break}else{let N=t.map[_];if(N===void 0){N=new In(_);vn(t,N)}t=N}}}class bt{constructor(e,n){this.seq=[];this.map={};const t=e.getProgramParameter(n,e.ACTIVE_UNIFORMS);for(let l=0;l<t;++l){const u=e.getActiveUniform(n,l),_=e.getUniformLocation(n,u.name);Bo(u,_,this)}const i=[],f=[];for(const l of this.seq)if(l.type===e.SAMPLER_2D_SHADOW||l.type===e.SAMPLER_CUBE_SHADOW||l.type===e.SAMPLER_2D_ARRAY_SHADOW)i.push(l);else f.push(l);if(i.length>0)this.seq=i.concat(f)}setValue(e,n,t,i){const f=this.map[n];if(f!==void 0)f.setValue(e,t,i)}setOptional(e,n,t){const i=n[t];if(i!==void 0)this.setValue(e,t,i)}static upload(e,n,t,i){for(let f=0,l=n.length;f!==l;++f){const u=n[f],_=t[u.id];if(_.needsUpdate!==!1)u.setValue(e,_.value,i)}}static seqWithValue(e,n){const t=[];for(let i=0,f=e.length;i!==f;++i){const l=e[i];if(l.id in n)t.push(l)}return t}}function Sn(e,n,t){const i=e.createShader(n);e.shaderSource(i,t);e.compileShader(i);return i}const Go=37297;let Ho=0;function Vo(e,n){const t=e.split(`
`),i=[],f=Math.max(n-6,0),l=Math.min(n+6,t.length);for(let u=f;u<l;u++){const _=u+1;i.push(`${_===n?">":" "} ${_}: ${t[u]}`)}return i.join(`
`)}const En=new Matrix3;function Wo(e){ColorManagement._getMatrix(En,ColorManagement.workingColorSpace,e);const n=`mat3( ${En.elements.map((t)=>t.toFixed(4))} )`;switch(ColorManagement.getTransfer(e)){case LinearTransfer:return[n,"LinearTransferOETF"];case SRGBTransfer:return[n,"sRGBTransferOETF"];default:warn("WebGLProgram: Unsupported color space: ",e);return[n,"LinearTransferOETF"]}}function Mn(e,n,t){const i=e.getShaderParameter(n,e.COMPILE_STATUS),l=(e.getShaderInfoLog(n)||"").trim();if(i&&l==="")return"";const u=/ERROR: 0:(\d+)/.exec(l);if(u){const _=parseInt(u[1]);return t.toUpperCase()+`

`+l+`

`+Vo(e.getShaderSource(n),_)}else return l}function ko(e,n){const t=Wo(n);return[`vec4 ${e}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const zo={[LinearToneMapping]:"Linear",[ReinhardToneMapping]:"Reinhard",[CineonToneMapping]:"Cineon",[ACESFilmicToneMapping]:"ACESFilmic",[AgXToneMapping]:"AgX",[NeutralToneMapping]:"Neutral",[CustomToneMapping]:"Custom"};function Xo(e,n){const t=zo[n];if(t===void 0){warn("WebGLProgram: Unsupported toneMapping:",n);return"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"}return"vec3 "+e+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const wt=new Vector3;function Ko(){ColorManagement.getLuminanceCoefficients(wt);const e=wt.x.toFixed(4),n=wt.y.toFixed(4),t=wt.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${n}, ${t} );`,"\treturn dot( weights, rgb );","}"].join(`
`)}function Yo(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(At).join(`
`)}function qo(e){const n=[];for(const t in e){const i=e[t];if(i===!1)continue;n.push("#define "+t+" "+i)}return n.join(`
`)}function Zo(e,n){const t={},i=e.getProgramParameter(n,e.ACTIVE_ATTRIBUTES);for(let f=0;f<i;f++){const l=e.getActiveAttrib(n,f),u=l.name;let _=1;if(l.type===e.FLOAT_MAT2)_=2;if(l.type===e.FLOAT_MAT3)_=3;if(l.type===e.FLOAT_MAT4)_=4;t[u]={type:l.type,location:e.getAttribLocation(n,u),locationSize:_}}return t}function At(e){return e!==""}function xn(e,n){const t=n.numSpotLightShadows+n.numSpotLightMaps-n.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,n.numSunLights).replace(/NUM_DIR_LIGHTS/g,n.numDirLights).replace(/NUM_SPOT_LIGHTS/g,n.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,n.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,n.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,n.numPointLights).replace(/NUM_HEMI_LIGHTS/g,n.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,n.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,n.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,n.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,n.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,n.numPointLightShadows)}function Tn(e,n){return e.replace(/NUM_CLIPPING_PLANES/g,n.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,n.numClippingPlanes-n.numClipIntersection)}const $o=/^[ \t]*#include +<([\w\d./]+)>/gm;function Wt(e){return e.replace($o,Jo)}const Qo=new Map;function Jo(e,n){let t=ShaderChunk[n];if(t===void 0){const i=Qo.get(n);if(i!==void 0){t=ShaderChunk[i];warn('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',n,i)}else throw Error("THREE.WebGLProgram: Can not resolve #include <"+n+">")}return Wt(t)}const jo=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function An(e){return e.replace(jo,es)}function es(e,n,t,i){let f="";for(let l=parseInt(n);l<parseInt(t);l++)f+=i.replace(/\[\s*i\s*\]/g,"[ "+l+" ]").replace(/UNROLLED_LOOP_INDEX/g,l);return f}function Rn(e){let n=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;if(e.precision==="highp")n+=`
#define HIGH_PRECISION`;else if(e.precision==="mediump")n+=`
#define MEDIUM_PRECISION`;else if(e.precision==="lowp")n+=`
#define LOW_PRECISION`;return n}const ts={[PCFShadowMap]:"SHADOWMAP_TYPE_PCF",[VSMShadowMap]:"SHADOWMAP_TYPE_VSM"};function ns(e){return ts[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const is={[CubeReflectionMapping]:"ENVMAP_TYPE_CUBE",[CubeRefractionMapping]:"ENVMAP_TYPE_CUBE",[CubeUVReflectionMapping]:"ENVMAP_TYPE_CUBE_UV"};function rs(e){if(e.envMap===!1)return"ENVMAP_TYPE_CUBE";return is[e.envMapMode]||"ENVMAP_TYPE_CUBE"}const as={[CubeRefractionMapping]:"ENVMAP_MODE_REFRACTION"};function os(e){if(e.envMap===!1)return"ENVMAP_MODE_REFLECTION";return as[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}const ss={[MultiplyOperation]:"ENVMAP_BLENDING_MULTIPLY",[MixOperation]:"ENVMAP_BLENDING_MIX",[AddOperation]:"ENVMAP_BLENDING_ADD"};function ls(e){if(e.envMap===!1)return"ENVMAP_BLENDING_NONE";return ss[e.combine]||"ENVMAP_BLENDING_NONE"}function cs(e){const n=e.envMapCubeUVHeight;if(n===null)return null;const t=Math.log2(n)-2,i=1/n;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function fs(e,n,t,i){const f=e.getContext(),l=t.defines;let{vertexShader:u,fragmentShader:_}=t;const F=ns(t),x=rs(t),y=os(t),N=ls(t),h=cs(t),T=Yo(t),P=qo(l),W=f.createProgram();let d,o,U=t.glslVersion?"#version "+t.glslVersion+`
`:"";if(t.isRawShaderMaterial){d=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,P].filter(At).join(`
`);if(d.length>0)d+=`
`;o=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,P].filter(At).join(`
`);if(o.length>0)o+=`
`}else{d=[Rn(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,P,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+y:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+F:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","\tattribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","\tattribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","\tuniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","\tattribute vec2 uv1;","#endif","#ifdef USE_UV2","\tattribute vec2 uv2;","#endif","#ifdef USE_UV3","\tattribute vec2 uv3;","#endif","#ifdef USE_TANGENT","\tattribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","\tattribute vec4 color;","#elif defined( USE_COLOR )","\tattribute vec3 color;","#endif","#ifdef USE_SKINNING","\tattribute vec4 skinIndex;","\tattribute vec4 skinWeight;","#endif",`
`].filter(At).join(`
`);o=[Rn(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,P,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+x:"",t.envMap?"#define "+y:"",t.envMap?"#define "+N:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+F:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==NoToneMapping?"#define TONE_MAPPING":"",t.toneMapping!==NoToneMapping?ShaderChunk.tonemapping_pars_fragment:"",t.toneMapping!==NoToneMapping?Xo("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",ShaderChunk.colorspace_pars_fragment,ko("linearToOutputTexel",t.outputColorSpace),Ko(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(At).join(`
`)}u=Wt(u);u=xn(u,t);u=Tn(u,t);_=Wt(_);_=xn(_,t);_=Tn(_,t);u=An(u);_=An(_);if(t.isRawShaderMaterial!==!0){U=`#version 300 es
`;d=[T,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+d;o=["#define varying in",t.glslVersion===GLSL3?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===GLSL3?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+o}const X=U+d+u,m=U+o+_,g=Sn(f,f.VERTEX_SHADER,X),A=Sn(f,f.FRAGMENT_SHADER,m);f.attachShader(W,g);f.attachShader(W,A);if(t.index0AttributeName!==void 0)f.bindAttribLocation(W,0,t.index0AttributeName);else if(t.hasPositionAttribute===!0)f.bindAttribLocation(W,0,"position");f.linkProgram(W);function L(D){if(e.debug.checkShaderErrors){const O=f.getProgramInfoLog(W)||"",te=f.getShaderInfoLog(g)||"",C=f.getShaderInfoLog(A)||"",k=O.trim(),Q=te.trim(),G=C.trim();let pe=!0,Y=!0;if(f.getProgramParameter(W,f.LINK_STATUS)===!1){pe=!1;if(typeof e.debug.onShaderError==="function")e.debug.onShaderError(f,W,g,A);else{const J=Mn(f,g,"vertex"),ee=Mn(f,A,"fragment");error("WebGLProgram: Shader Error "+f.getError()+" - VALIDATE_STATUS "+f.getProgramParameter(W,f.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+k+`
`+J+`
`+ee)}}else if(k!=="")warn("WebGLProgram: Program Info Log:",k);else if(Q===""||G==="")Y=!1;if(Y)D.diagnostics={runnable:pe,programLog:k,vertexShader:{log:Q,prefix:d},fragmentShader:{log:G,prefix:o}}}f.deleteShader(g);f.deleteShader(A);c=new bt(f,W);p=Zo(f,W)}let c;this.getUniforms=function(){if(c===void 0)L(this);return c};let p;this.getAttributes=function(){if(p===void 0)L(this);return p};let Z=t.rendererExtensionParallelShaderCompile===!1;this.isReady=function(){if(Z===!1)Z=f.getProgramParameter(W,Go);return Z};this.destroy=function(){i.releaseStatesOfProgram(this);f.deleteProgram(W);this.program=void 0};this.type=t.shaderType;this.name=t.shaderName;this.id=Ho++;this.cacheKey=n;this.usedTimes=1;this.program=W;this.vertexShader=g;this.fragmentShader=A;return this}let ds=0;class Nn{constructor(){this.shaderCache=new Map;this.materialCache=new Map}update(e,n,t){const i=this._getShaderCacheForMaterial(e);if(i.has(n)===!1){i.add(n);n.usedTimes++}if(i.has(t)===!1){i.add(t);t.usedTimes++}return this}remove(e){const n=this.materialCache.get(e);for(const t of n){t.usedTimes--;if(t.usedTimes===0)this.shaderCache.delete(t.code)}this.materialCache.delete(e);return this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear();this.materialCache.clear()}_getShaderCacheForMaterial(e){const n=this.materialCache;let t=n.get(e);if(t===void 0){t=new Set;n.set(e,t)}return t}_getShaderStage(e){const n=this.shaderCache;let t=n.get(e);if(t===void 0){t=new yn(e);n.set(e,t)}return t}}class yn{constructor(e){this.id=ds++;this.code=e;this.usedTimes=0}}function us(e){return e===RGFormat||e===RG11_EAC_Format||e===RED_GREEN_RGTC2_Format}function ps(e,n,t,i,f,l){const u=new Layers,_=new Nn,F=new Set,x=[],y=new Map,N=i.logarithmicDepthBuffer;let h=i.precision;const T={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function P(c){F.add(c);if(c===0)return"uv";return`uv${c}`}function W(c,p,Z,D,O,te){const C=D.fog,k=O.geometry,Q=c.isMeshStandardMaterial||c.isMeshLambertMaterial||c.isMeshPhongMaterial?D.environment:null,G=c.isMeshStandardMaterial||c.isMeshLambertMaterial&&!c.envMap||c.isMeshPhongMaterial&&!c.envMap,pe=n.get(c.envMap||Q,G),Y=!!pe&&pe.mapping===CubeUVReflectionMapping?pe.image.height:null,J=T[c.type];if(c.precision!==null){h=i.getMaxPrecision(c.precision);if(h!==c.precision)warn("WebGLProgram.getParameters:",c.precision,"not supported, using",h,"instead.")}const ee=k.morphAttributes.position||k.morphAttributes.normal||k.morphAttributes.color,Pe=ee!==void 0?ee.length:0;let Ae=0;if(k.morphAttributes.position!==void 0)Ae=1;if(k.morphAttributes.normal!==void 0)Ae=2;if(k.morphAttributes.color!==void 0)Ae=3;let Ze,we,V,ie;if(J){const ke=ShaderLib[J];Ze=ke.vertexShader;we=ke.fragmentShader}else{Ze=c.vertexShader;we=c.fragmentShader;const ke=_.getVertexShaderStage(c),Be=_.getFragmentShaderStage(c);_.update(c,ke,Be);V=ke.id;ie=Be.id}const re=e.getRenderTarget(),Re=e.state.buffers.depth.getReversed(),be=O.isInstancedMesh===!0,Te=O.isBatchedMesh===!0,Qe=!!c.map,De=!!c.matcap,Ie=!!pe,He=!!c.aoMap,Ne=!!c.lightMap,nt=!!c.bumpMap&&c.wireframe===!1,Xe=!!c.normalMap,at=!!c.displacementMap,Je=!!c.emissiveMap,je=!!c.metalnessMap,E=!!c.roughnessMap,ot=c.anisotropy>0,Oe=c.clearcoat>0,Ye=c.dispersion>0,s=c.retroreflectivity>0,r=c.iridescence>0,v=c.sheen>0,w=c.transmission>0,K=ot&&!!c.anisotropyMap,ne=Oe&&!!c.clearcoatMap,se=Oe&&!!c.clearcoatNormalMap,B=Oe&&!!c.clearcoatRoughnessMap,z=r&&!!c.iridescenceMap,ue=r&&!!c.iridescenceThicknessMap,Ee=v&&!!c.sheenColorMap,le=v&&!!c.sheenRoughnessMap,j=!!c.specularMap,Me=!!c.specularColorMap,xe=!!c.specularIntensityMap,Fe=w&&!!c.transmissionMap,M=w&&!!c.thicknessMap,ae=!!c.gradientMap,H=!!c.alphaMap,oe=c.alphaTest>0,he=!!c.alphaHash,q=!!c.extensions;let ce=NoToneMapping;if(c.toneMapped){if(re===null||re.isXRRenderTarget===!0)ce=e.toneMapping}const Ce={shaderID:J,shaderType:c.type,shaderName:c.name,vertexShader:Ze,fragmentShader:we,defines:c.defines,customVertexShaderID:V,customFragmentShaderID:ie,isRawShaderMaterial:c.isRawShaderMaterial===!0,glslVersion:c.glslVersion,precision:h,batching:Te,batchingColor:Te&&O._colorsTexture!==null,instancing:be,instancingColor:be&&O.instanceColor!==null,instancingMorph:be&&O.morphTexture!==null,outputColorSpace:re===null?e.outputColorSpace:re.isXRRenderTarget===!0?re.texture.colorSpace:ColorManagement.workingColorSpace,alphaToCoverage:!!c.alphaToCoverage,map:Qe,matcap:De,envMap:Ie,envMapMode:Ie&&pe.mapping,envMapCubeUVHeight:Y,aoMap:He,lightMap:Ne,bumpMap:nt,normalMap:Xe,displacementMap:at,emissiveMap:Je,normalMapObjectSpace:Xe&&c.normalMapType===ObjectSpaceNormalMap,normalMapTangentSpace:Xe&&c.normalMapType===TangentSpaceNormalMap,packedNormalMap:Xe&&c.normalMapType===TangentSpaceNormalMap&&us(c.normalMap.format),metalnessMap:je,roughnessMap:E,anisotropy:ot,anisotropyMap:K,clearcoat:Oe,clearcoatMap:ne,clearcoatNormalMap:se,clearcoatRoughnessMap:B,dispersion:Ye,retroreflection:s,iridescence:r,iridescenceMap:z,iridescenceThicknessMap:ue,sheen:v,sheenColorMap:Ee,sheenRoughnessMap:le,specularMap:j,specularColorMap:Me,specularIntensityMap:xe,transmission:w,transmissionMap:Fe,thicknessMap:M,gradientMap:ae,opaque:c.transparent===!1&&c.blending===NormalBlending&&c.alphaToCoverage===!1,alphaMap:H,alphaTest:oe,alphaHash:he,combine:c.combine,mapUv:Qe&&P(c.map.channel),aoMapUv:He&&P(c.aoMap.channel),lightMapUv:Ne&&P(c.lightMap.channel),bumpMapUv:nt&&P(c.bumpMap.channel),normalMapUv:Xe&&P(c.normalMap.channel),displacementMapUv:at&&P(c.displacementMap.channel),emissiveMapUv:Je&&P(c.emissiveMap.channel),metalnessMapUv:je&&P(c.metalnessMap.channel),roughnessMapUv:E&&P(c.roughnessMap.channel),anisotropyMapUv:K&&P(c.anisotropyMap.channel),clearcoatMapUv:ne&&P(c.clearcoatMap.channel),clearcoatNormalMapUv:se&&P(c.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:B&&P(c.clearcoatRoughnessMap.channel),iridescenceMapUv:z&&P(c.iridescenceMap.channel),iridescenceThicknessMapUv:ue&&P(c.iridescenceThicknessMap.channel),sheenColorMapUv:Ee&&P(c.sheenColorMap.channel),sheenRoughnessMapUv:le&&P(c.sheenRoughnessMap.channel),specularMapUv:j&&P(c.specularMap.channel),specularColorMapUv:Me&&P(c.specularColorMap.channel),specularIntensityMapUv:xe&&P(c.specularIntensityMap.channel),transmissionMapUv:Fe&&P(c.transmissionMap.channel),thicknessMapUv:M&&P(c.thicknessMap.channel),alphaMapUv:H&&P(c.alphaMap.channel),vertexTangents:!!k.attributes.tangent&&(Xe||ot),vertexNormals:!!k.attributes.normal,vertexColors:c.vertexColors,vertexAlphas:c.vertexColors===!0&&!!k.attributes.color&&k.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!k.attributes.uv&&(Qe||H),fog:!!C,useFog:c.fog===!0,fogExp2:!!C&&C.isFogExp2,flatShading:c.wireframe===!1&&(c.flatShading===!0||k.attributes.normal===void 0&&Xe===!1&&(c.isMeshLambertMaterial||c.isMeshPhongMaterial||c.isMeshStandardMaterial||c.isMeshPhysicalMaterial)),sizeAttenuation:c.sizeAttenuation===!0,logarithmicDepthBuffer:N,reversedDepthBuffer:Re,skinning:O.isSkinnedMesh===!0,hasPositionAttribute:k.attributes.position!==void 0,morphTargets:k.morphAttributes.position!==void 0,morphNormals:k.morphAttributes.normal!==void 0,morphColors:k.morphAttributes.color!==void 0,morphTargetsCount:Pe,morphTextureStride:Ae,numSunLights:p.sun.length,numDirLights:p.directional.length,numPointLights:p.point.length,numSpotLights:p.spot.length,numSpotLightMaps:p.spotLightMap.length,numRectAreaLights:p.rectArea.length,numHemiLights:p.hemi.length,numSunLightShadows:p.sunShadowMap.length,numDirLightShadows:p.directionalShadowMap.length,numPointLightShadows:p.pointShadowMap.length,numSpotLightShadows:p.spotShadowMap.length,numSpotLightShadowsWithMaps:p.numSpotLightShadowsWithMaps,numLightProbes:p.numLightProbes,numLightProbeGrids:te.length,numClippingPlanes:l.numPlanes,numClipIntersection:l.numIntersection,dithering:c.dithering,shadowMapEnabled:e.shadowMap.enabled&&Z.length>0,shadowMapType:e.shadowMap.type,toneMapping:ce,decodeVideoTexture:Qe&&c.map.isVideoTexture===!0&&ColorManagement.getTransfer(c.map.colorSpace)===SRGBTransfer,decodeVideoTextureEmissive:Je&&c.emissiveMap.isVideoTexture===!0&&ColorManagement.getTransfer(c.emissiveMap.colorSpace)===SRGBTransfer,premultipliedAlpha:c.premultipliedAlpha,doubleSided:c.side===DoubleSide,flipSided:c.side===BackSide,useDepthPacking:c.depthPacking>=0,depthPacking:c.depthPacking||0,index0AttributeName:c.index0AttributeName,extensionClipCullDistance:q&&c.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(q&&c.extensions.multiDraw===!0||Te)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:c.customProgramCacheKey()};Ce.vertexUv1s=F.has(1);Ce.vertexUv2s=F.has(2);Ce.vertexUv3s=F.has(3);F.clear();return Ce}function d(c){const p=[];if(c.shaderID)p.push(c.shaderID);else{p.push(c.customVertexShaderID);p.push(c.customFragmentShaderID)}if(c.defines!==void 0)for(const Z in c.defines){p.push(Z);p.push(c.defines[Z])}if(c.isRawShaderMaterial===!1){o(p,c);U(p,c);p.push(e.outputColorSpace)}p.push(c.customProgramCacheKey);return p.join()}function o(c,p){c.push(p.precision);c.push(p.outputColorSpace);c.push(p.envMapMode);c.push(p.envMapCubeUVHeight);c.push(p.mapUv);c.push(p.alphaMapUv);c.push(p.lightMapUv);c.push(p.aoMapUv);c.push(p.bumpMapUv);c.push(p.normalMapUv);c.push(p.displacementMapUv);c.push(p.emissiveMapUv);c.push(p.metalnessMapUv);c.push(p.roughnessMapUv);c.push(p.anisotropyMapUv);c.push(p.clearcoatMapUv);c.push(p.clearcoatNormalMapUv);c.push(p.clearcoatRoughnessMapUv);c.push(p.iridescenceMapUv);c.push(p.iridescenceThicknessMapUv);c.push(p.sheenColorMapUv);c.push(p.sheenRoughnessMapUv);c.push(p.specularMapUv);c.push(p.specularColorMapUv);c.push(p.specularIntensityMapUv);c.push(p.transmissionMapUv);c.push(p.thicknessMapUv);c.push(p.combine);c.push(p.fogExp2);c.push(p.sizeAttenuation);c.push(p.morphTargetsCount);c.push(p.morphAttributeCount);c.push(p.numSunLights);c.push(p.numDirLights);c.push(p.numPointLights);c.push(p.numSpotLights);c.push(p.numSpotLightMaps);c.push(p.numHemiLights);c.push(p.numRectAreaLights);c.push(p.numSunLightShadows);c.push(p.numDirLightShadows);c.push(p.numPointLightShadows);c.push(p.numSpotLightShadows);c.push(p.numSpotLightShadowsWithMaps);c.push(p.numLightProbes);c.push(p.shadowMapType);c.push(p.toneMapping);c.push(p.numClippingPlanes);c.push(p.numClipIntersection);c.push(p.depthPacking)}function U(c,p){u.disableAll();if(p.instancing)u.enable(0);if(p.instancingColor)u.enable(1);if(p.instancingMorph)u.enable(2);if(p.matcap)u.enable(3);if(p.envMap)u.enable(4);if(p.normalMapObjectSpace)u.enable(5);if(p.normalMapTangentSpace)u.enable(6);if(p.clearcoat)u.enable(7);if(p.iridescence)u.enable(8);if(p.alphaTest)u.enable(9);if(p.vertexColors)u.enable(10);if(p.vertexAlphas)u.enable(11);if(p.vertexUv1s)u.enable(12);if(p.vertexUv2s)u.enable(13);if(p.vertexUv3s)u.enable(14);if(p.vertexTangents)u.enable(15);if(p.anisotropy)u.enable(16);if(p.alphaHash)u.enable(17);if(p.batching)u.enable(18);if(p.dispersion)u.enable(19);if(p.retroreflection)u.enable(24);if(p.batchingColor)u.enable(20);if(p.gradientMap)u.enable(21);if(p.packedNormalMap)u.enable(22);if(p.vertexNormals)u.enable(23);c.push(u.mask);u.disableAll();if(p.fog)u.enable(0);if(p.useFog)u.enable(1);if(p.flatShading)u.enable(2);if(p.logarithmicDepthBuffer)u.enable(3);if(p.reversedDepthBuffer)u.enable(4);if(p.skinning)u.enable(5);if(p.morphTargets)u.enable(6);if(p.morphNormals)u.enable(7);if(p.morphColors)u.enable(8);if(p.premultipliedAlpha)u.enable(9);if(p.shadowMapEnabled)u.enable(10);if(p.doubleSided)u.enable(11);if(p.flipSided)u.enable(12);if(p.useDepthPacking)u.enable(13);if(p.dithering)u.enable(14);if(p.transmission)u.enable(15);if(p.sheen)u.enable(16);if(p.opaque)u.enable(17);if(p.pointsUvs)u.enable(18);if(p.decodeVideoTexture)u.enable(19);if(p.decodeVideoTextureEmissive)u.enable(20);if(p.alphaToCoverage)u.enable(21);if(p.numLightProbeGrids>0)u.enable(22);if(p.hasPositionAttribute)u.enable(23);c.push(u.mask)}function X(c){const p=T[c.type];let Z;if(p){const D=ShaderLib[p];Z=UniformsUtils.clone(D.uniforms)}else Z=c.uniforms;return Z}function m(c,p){let Z=y.get(p);if(Z!==void 0)++Z.usedTimes;else{Z=new fs(e,p,c,f);x.push(Z);y.set(p,Z)}return Z}function g(c){if(--c.usedTimes===0){const p=x.indexOf(c);x[p]=x[x.length-1];x.pop();y.delete(c.cacheKey);c.destroy()}}function A(c){_.remove(c)}function L(){_.dispose()}return{getParameters:W,getProgramCacheKey:d,getUniforms:X,acquireProgram:m,releaseProgram:g,releaseShaderCache:A,programs:x,dispose:L}}function hs(){let e=new WeakMap;function n(u){return e.has(u)}function t(u){let _=e.get(u);if(_===void 0){_={};e.set(u,_)}return _}function i(u){e.delete(u)}function f(u,_,F){e.get(u)[_]=F}function l(){e=new WeakMap}return{has:n,get:t,remove:i,update:f,dispose:l}}function ms(e,n){if(e.groupOrder!==n.groupOrder)return e.groupOrder-n.groupOrder;else if(e.renderOrder!==n.renderOrder)return e.renderOrder-n.renderOrder;else if(e.material.id!==n.material.id)return e.material.id-n.material.id;else if(e.materialVariant!==n.materialVariant)return e.materialVariant-n.materialVariant;else if(e.z!==n.z)return e.z-n.z;else return e.id-n.id}function bn(e,n){if(e.groupOrder!==n.groupOrder)return e.groupOrder-n.groupOrder;else if(e.renderOrder!==n.renderOrder)return e.renderOrder-n.renderOrder;else if(e.z!==n.z)return n.z-e.z;else return e.id-n.id}function Cn(){const e=[];let n=0;const t=[],i=[],f=[];function l(){n=0;t.length=0;i.length=0;f.length=0}function u(h){let T=0;if(h.isInstancedMesh)T+=2;if(h.isSkinnedMesh)T+=1;return T}function _(h,T,P,W,d,o){let U=e[n];if(U===void 0){U={id:h.id,object:h,geometry:T,material:P,materialVariant:u(h),groupOrder:W,renderOrder:h.renderOrder,z:d,group:o};e[n]=U}else{U.id=h.id;U.object=h;U.geometry=T;U.material=P;U.materialVariant=u(h);U.groupOrder=W;U.renderOrder=h.renderOrder;U.z=d;U.group=o}n++;return U}function F(h,T,P,W,d,o,U){if(U.reversedDepth===!0)d=-d;const X=_(h,T,P,W,d,o);if(P.transmission>0)i.push(X);else if(P.transparent===!0)f.push(X);else t.push(X)}function x(h,T,P,W,d,o){const U=_(h,T,P,W,d,o);if(P.transmission>0)i.unshift(U);else if(P.transparent===!0)f.unshift(U);else t.unshift(U)}function y(h,T){if(t.length>1)t.sort(h||ms);if(i.length>1)i.sort(T||bn);if(f.length>1)f.sort(T||bn)}function N(){for(let h=n,T=e.length;h<T;h++){const P=e[h];if(P.id===null)break;P.id=null;P.object=null;P.geometry=null;P.material=null;P.group=null}}return{opaque:t,transmissive:i,transparent:f,init:l,push:F,unshift:x,finish:N,sort:y}}function _s(){let e=new WeakMap;function n(i,f){const l=e.get(i);let u;if(l===void 0){u=new Cn;e.set(i,[u])}else if(f>=l.length){u=new Cn;l.push(u)}else u=l[f];return u}function t(){e=new WeakMap}return{get:n,dispose:t}}function gs(){const e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"SunLight":case"DirectionalLight":t={direction:new Vector3,color:new Color};break;case"SpotLight":t={position:new Vector3,direction:new Vector3,color:new Color,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new Vector3,color:new Color,distance:0,decay:0};break;case"HemisphereLight":t={direction:new Vector3,skyColor:new Color,groundColor:new Color};break;case"RectAreaLight":t={color:new Color,position:new Vector3,halfWidth:new Vector3,halfHeight:new Vector3};break}e[n.id]=t;return t}}}function vs(){const e={};return{get:function(n){if(e[n.id]!==void 0)return e[n.id];let t;switch(n.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Vector2};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Vector2};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Vector2,shadowCameraNear:1,shadowCameraFar:1000};break}e[n.id]=t;return t}}}let Ss=0;function Es(e,n){return(n.castShadow?2:0)-(e.castShadow?2:0)+(n.map?1:0)-(e.map?1:0)}function Ms(e){const n=new gs,t=vs(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let x=0;x<9;x++)i.probe.push(new Vector3);const f=new Vector3,l=new Matrix4,u=new Matrix4;function _(x){let y=0,N=0,h=0;for(let O=0;O<9;O++)i.probe[O].set(0,0,0);let T=0,P=0,W=0,d=0,o=0,U=0,X=0,m=0,g=0,A=0,L=0,c=0,p=0,Z=0;x.sort(Es);for(let O=0,te=x.length;O<te;O++){const C=x[O],{color:k,intensity:Q,distance:G}=C;let pe=null;if(C.shadow&&C.shadow.map)if(C.shadow.map.texture.format===RGFormat)pe=C.shadow.map.texture;else pe=C.shadow.map.depthTexture||C.shadow.map.texture;if(C.isAmbientLight){y+=k.r*Q;N+=k.g*Q;h+=k.b*Q}else if(C.isLightProbe){for(let Y=0;Y<9;Y++)i.probe[Y].addScaledVector(C.sh.coefficients[Y],Q);Z++}else if(C.isSunLight){const Y=n.get(C);Y.color.copy(C.color).multiplyScalar(C.intensity);if(C.castShadow){const J=C.shadow,ee=t.get(C);ee.shadowIntensity=J.intensity;ee.shadowBias=J.bias;ee.shadowNormalBias=J.normalBias;ee.shadowRadius=J.radius;ee.shadowMapSize.copy(J.mapSize).multiply(J.getFrameExtents());i.sunShadow[P]=ee;i.sunShadowMap[P]=pe;const Pe=J.getViewportCount();for(let Ae=0;Ae<Pe;Ae++){i.sunShadowMatrix[W+Ae]=J.getMatrix(Ae);i.sunShadowCascade[W+Ae]=J._cascadeData[Ae]}W+=Pe;P++}i.sun[T]=Y;T++}else if(C.isDirectionalLight){const Y=n.get(C);Y.color.copy(C.color).multiplyScalar(C.intensity);if(C.castShadow){const J=C.shadow,ee=t.get(C);ee.shadowIntensity=J.intensity;ee.shadowBias=J.bias;ee.shadowNormalBias=J.normalBias;ee.shadowRadius=J.radius;ee.shadowMapSize=J.mapSize;i.directionalShadow[d]=ee;i.directionalShadowMap[d]=pe;i.directionalShadowMatrix[d]=C.shadow.matrix;g++}i.directional[d]=Y;d++}else if(C.isSpotLight){const Y=n.get(C);Y.position.setFromMatrixPosition(C.matrixWorld);Y.color.copy(k).multiplyScalar(Q);Y.distance=G;Y.coneCos=Math.cos(C.angle);Y.penumbraCos=Math.cos(C.angle*(1-C.penumbra));Y.decay=C.decay;i.spot[U]=Y;const J=C.shadow;if(C.map){i.spotLightMap[c]=C.map;c++;J.updateMatrices(C);if(C.castShadow)p++}i.spotLightMatrix[U]=J.matrix;if(C.castShadow){const ee=t.get(C);ee.shadowIntensity=J.intensity;ee.shadowBias=J.bias;ee.shadowNormalBias=J.normalBias;ee.shadowRadius=J.radius;ee.shadowMapSize=J.mapSize;i.spotShadow[U]=ee;i.spotShadowMap[U]=pe;L++}U++}else if(C.isRectAreaLight){const Y=n.get(C);Y.color.copy(k).multiplyScalar(Q);Y.halfWidth.set(C.width*0.5,0,0);Y.halfHeight.set(0,C.height*0.5,0);i.rectArea[X]=Y;X++}else if(C.isPointLight){const Y=n.get(C);Y.color.copy(C.color).multiplyScalar(C.intensity);Y.distance=C.distance;Y.decay=C.decay;if(C.castShadow){const J=C.shadow,ee=t.get(C);ee.shadowIntensity=J.intensity;ee.shadowBias=J.bias;ee.shadowNormalBias=J.normalBias;ee.shadowRadius=J.radius;ee.shadowMapSize=J.mapSize;ee.shadowCameraNear=J.camera.near;ee.shadowCameraFar=J.camera.far;i.pointShadow[o]=ee;i.pointShadowMap[o]=pe;i.pointShadowMatrix[o]=C.shadow.matrix;A++}i.point[o]=Y;o++}else if(C.isHemisphereLight){const Y=n.get(C);Y.skyColor.copy(C.color).multiplyScalar(Q);Y.groundColor.copy(C.groundColor).multiplyScalar(Q);i.hemi[m]=Y;m++}}if(X>0)if(e.has("OES_texture_float_linear")===!0){i.rectAreaLTC1=UniformsLib.LTC_FLOAT_1;i.rectAreaLTC2=UniformsLib.LTC_FLOAT_2}else{i.rectAreaLTC1=UniformsLib.LTC_HALF_1;i.rectAreaLTC2=UniformsLib.LTC_HALF_2}i.ambient[0]=y;i.ambient[1]=N;i.ambient[2]=h;const D=i.hash;if(D.sunLength!==T||D.directionalLength!==d||D.pointLength!==o||D.spotLength!==U||D.rectAreaLength!==X||D.hemiLength!==m||D.numSunShadows!==P||D.numDirectionalShadows!==g||D.numPointShadows!==A||D.numSpotShadows!==L||D.numSpotMaps!==c||D.numLightProbes!==Z){i.sun.length=T;i.directional.length=d;i.spot.length=U;i.rectArea.length=X;i.point.length=o;i.hemi.length=m;i.sunShadow.length=P;i.sunShadowMap.length=P;i.sunShadowMatrix.length=W;i.sunShadowCascade.length=W;i.directionalShadow.length=g;i.directionalShadowMap.length=g;i.directionalShadowMatrix.length=g;i.pointShadow.length=A;i.pointShadowMap.length=A;i.pointShadowMatrix.length=A;i.spotShadow.length=L;i.spotShadowMap.length=L;i.spotLightMatrix.length=L+c-p;i.spotLightMap.length=c;i.numSpotLightShadowsWithMaps=p;i.numLightProbes=Z;D.sunLength=T;D.directionalLength=d;D.pointLength=o;D.spotLength=U;D.rectAreaLength=X;D.hemiLength=m;D.numSunShadows=P;D.numDirectionalShadows=g;D.numPointShadows=A;D.numSpotShadows=L;D.numSpotMaps=c;D.numLightProbes=Z;i.version=Ss++}}function F(x,y){let N=0,h=0,T=0,P=0,W=0,d=0;const o=y.matrixWorldInverse;for(let U=0,X=x.length;U<X;U++){const m=x[U];if(m.isSunLight){const g=i.sun[N];g.direction.setFromMatrixPosition(m.matrixWorld);g.direction.transformDirection(o);N++}else if(m.isDirectionalLight){const g=i.directional[h];g.direction.setFromMatrixPosition(m.matrixWorld);f.setFromMatrixPosition(m.target.matrixWorld);g.direction.sub(f);g.direction.transformDirection(o);h++}else if(m.isSpotLight){const g=i.spot[P];g.position.setFromMatrixPosition(m.matrixWorld);g.position.applyMatrix4(o);g.direction.setFromMatrixPosition(m.matrixWorld);f.setFromMatrixPosition(m.target.matrixWorld);g.direction.sub(f);g.direction.transformDirection(o);P++}else if(m.isRectAreaLight){const g=i.rectArea[W];g.position.setFromMatrixPosition(m.matrixWorld);g.position.applyMatrix4(o);u.identity();l.copy(m.matrixWorld);l.premultiply(o);u.extractRotation(l);g.halfWidth.set(m.width*0.5,0,0);g.halfHeight.set(0,m.height*0.5,0);g.halfWidth.applyMatrix4(u);g.halfHeight.applyMatrix4(u);W++}else if(m.isPointLight){const g=i.point[T];g.position.setFromMatrixPosition(m.matrixWorld);g.position.applyMatrix4(o);T++}else if(m.isHemisphereLight){const g=i.hemi[d];g.direction.setFromMatrixPosition(m.matrixWorld);g.direction.transformDirection(o);d++}}}return{setup:_,setupView:F,state:i}}function Pn(e){const n=new Ms(e),t=[],i=[],f=[];function l(h){N.camera=h;t.length=0;i.length=0;f.length=0}function u(h){t.push(h)}function _(h){i.push(h)}function F(h){f.push(h)}function x(){n.setup(t)}function y(h){n.setupView(t,h)}const N={lightsArray:t,shadowsArray:i,lightProbeGridArray:f,camera:null,lights:n,transmissionRenderTarget:{},textureUnits:0};return{init:l,state:N,setupLights:x,setupLightsView:y,pushLight:u,pushShadow:_,pushLightProbeGrid:F}}function xs(e){let n=new WeakMap;function t(f,l=0){const u=n.get(f);let _;if(u===void 0){_=new Pn(e);n.set(f,[_])}else if(l>=u.length){_=new Pn(e);u.push(_)}else _=u[l];return _}function i(){n=new WeakMap}return{get:t,dispose:i}}const Ts=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,As=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Rs=[new Vector3(1,0,0),new Vector3(-1,0,0),new Vector3(0,1,0),new Vector3(0,-1,0),new Vector3(0,0,1),new Vector3(0,0,-1)],bs=[new Vector3(0,-1,0),new Vector3(0,-1,0),new Vector3(0,0,1),new Vector3(0,0,-1),new Vector3(0,-1,0),new Vector3(0,-1,0)],Ln=new Matrix4,Rt=new Vector3,kt=new Vector3;function Cs(e,n,t){let i=new Frustum;const f=new Vector2,l=new Vector2,u=new Vector4,_=new MeshDepthMaterial,F=new MeshDistanceMaterial,x={},y=t.maxTextureSize,N={[FrontSide]:BackSide,[BackSide]:FrontSide,[DoubleSide]:DoubleSide},h=new ShaderMaterial({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Vector2},radius:{value:4}},vertexShader:Ts,fragmentShader:As}),T=h.clone();T.defines.HORIZONTAL_PASS=1;const P=new BufferGeometry;P.setAttribute("position",new BufferAttribute(new Float32Array([-1,-1,0.5,3,-1,0.5,-1,3,0.5]),3));const W=new Mesh(P,h),d=this;this.enabled=!1;this.autoUpdate=!0;this.needsUpdate=!1;this.type=PCFShadowMap;let o=this.type;this.render=function(A,L,c){if(d.enabled===!1)return;if(d.autoUpdate===!1&&d.needsUpdate===!1)return;if(A.length===0)return;if(this.type===PCFSoftShadowMap){warn("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.");this.type=PCFShadowMap}const p=e.getRenderTarget(),Z=e.getActiveCubeFace(),D=e.getActiveMipmapLevel(),O=e.state;O.setBlending(NoBlending);if(O.buffers.depth.getReversed()===!0)O.buffers.color.setClear(0,0,0,0);else O.buffers.color.setClear(1,1,1,1);O.buffers.depth.setTest(!0);O.setScissorTest(!1);const te=o!==this.type;if(te)L.traverse(function(C){if(C.material)if(Array.isArray(C.material))C.material.forEach((k)=>k.needsUpdate=!0);else C.material.needsUpdate=!0});for(let C=0,k=A.length;C<k;C++){const Q=A[C],G=Q.shadow;if(G===void 0){warn("WebGLShadowMap:",Q,"has no shadow.");continue}if(G.autoUpdate===!1&&G.needsUpdate===!1)continue;f.copy(G.mapSize);const pe=G.getFrameExtents();f.multiply(pe);l.copy(G.mapSize);if(f.x>y||f.y>y){if(f.x>y){l.x=Math.floor(y/pe.x);f.x=l.x*pe.x;G.mapSize.x=l.x}if(f.y>y){l.y=Math.floor(y/pe.y);f.y=l.y*pe.y;G.mapSize.y=l.y}}const Y=e.state.buffers.depth.getReversed();G.camera._reversedDepth=Y;if(G.map===null||te===!0){if(G.map!==null){if(G.map.depthTexture!==null){G.map.depthTexture.dispose();G.map.depthTexture=null}G.map.dispose()}if(this.type===VSMShadowMap){if(Q.isPointLight){warn("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}G.map=new WebGLRenderTarget(f.x,f.y,{format:RGFormat,type:HalfFloatType,minFilter:LinearFilter,magFilter:LinearFilter,generateMipmaps:!1});G.map.texture.name=Q.name+".shadowMap";G.map.depthTexture=new DepthTexture(f.x,f.y,FloatType);G.map.depthTexture.name=Q.name+".shadowMapDepth";G.map.depthTexture.format=DepthFormat;G.map.depthTexture.compareFunction=null;G.map.depthTexture.minFilter=NearestFilter;G.map.depthTexture.magFilter=NearestFilter}else{if(Q.isPointLight){G.map=new WebGLCubeRenderTarget(f.x);G.map.depthTexture=new CubeDepthTexture(f.x,UnsignedIntType)}else{G.map=new WebGLRenderTarget(f.x,f.y);G.map.depthTexture=new DepthTexture(f.x,f.y,UnsignedIntType)}G.map.depthTexture.name=Q.name+".shadowMap";G.map.depthTexture.format=DepthFormat;if(this.type===PCFShadowMap){G.map.depthTexture.compareFunction=Y?GreaterEqualCompare:LessEqualCompare;G.map.depthTexture.minFilter=LinearFilter;G.map.depthTexture.magFilter=LinearFilter}else{G.map.depthTexture.compareFunction=null;G.map.depthTexture.minFilter=NearestFilter;G.map.depthTexture.magFilter=NearestFilter}}G.camera.updateProjectionMatrix()}if(G.map.isWebGLCubeRenderTarget!==!0&&(G.map.width!==f.x||G.map.height!==f.y))G.map.setSize(f.x,f.y);const J=G.map.isWebGLCubeRenderTarget?6:G.getViewportCount();if(Q.isPointLight!==!0)G.updateMatrices(Q,c);for(let ee=0;ee<J;ee++){const Pe=G.getCamera(ee);if(Q.isPointLight){const{camera:Ae,matrix:Ze}=G,we=Q.distance||Ae.far;if(we!==Ae.far){Ae.far=we;Ae.updateProjectionMatrix()}Rt.setFromMatrixPosition(Q.matrixWorld);Ae.position.copy(Rt);kt.copy(Ae.position);kt.add(Rs[ee]);Ae.up.copy(bs[ee]);Ae.lookAt(kt);Ae.updateMatrixWorld();Ze.makeTranslation(-Rt.x,-Rt.y,-Rt.z);Ln.multiplyMatrices(Ae.projectionMatrix,Ae.matrixWorldInverse);G._frustum.setFromProjectionMatrix(Ln,Ae.coordinateSystem,Ae.reversedDepth)}if(G.map.isWebGLCubeRenderTarget){e.setRenderTarget(G.map,ee);e.clear()}else{if(ee===0){e.setRenderTarget(G.map);e.clear()}const Ae=G.getViewport(ee);u.set(l.x*Ae.x,l.y*Ae.y,l.x*Ae.z,l.y*Ae.w);O.viewport(u)}i=G.getFrustum(ee);m(L,c,Pe,Q,this.type)}if(G.isPointLightShadow!==!0&&this.type===VSMShadowMap)U(G,c);G.needsUpdate=!1}o=this.type;d.needsUpdate=!1;e.setRenderTarget(p,Z,D)};function U(A,L){const c=n.update(W);if(h.defines.VSM_SAMPLES!==A.blurSamples){h.defines.VSM_SAMPLES=A.blurSamples;T.defines.VSM_SAMPLES=A.blurSamples;h.needsUpdate=!0;T.needsUpdate=!0}if(A.mapPass===null)A.mapPass=new WebGLRenderTarget(f.x,f.y,{format:RGFormat,type:HalfFloatType});else if(A.mapPass.width!==A.map.width||A.mapPass.height!==A.map.height)A.mapPass.setSize(A.map.width,A.map.height);h.uniforms.shadow_pass.value=A.map.depthTexture;h.uniforms.resolution.value.set(A.map.width,A.map.height);h.uniforms.radius.value=A.radius;e.setRenderTarget(A.mapPass);e.clear();e.renderBufferDirect(L,null,c,h,W,null);T.uniforms.shadow_pass.value=A.mapPass.texture;T.uniforms.resolution.value.set(A.map.width,A.map.height);T.uniforms.radius.value=A.radius;e.setRenderTarget(A.map);e.clear();e.renderBufferDirect(L,null,c,T,W,null)}function X(A,L,c,p){let Z=null;const D=c.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(D!==void 0)Z=D;else{Z=c.isPointLight===!0?F:_;if(e.localClippingEnabled&&L.clipShadows===!0&&Array.isArray(L.clippingPlanes)&&L.clippingPlanes.length!==0||L.displacementMap&&L.displacementScale!==0||L.alphaMap&&L.alphaTest>0||L.map&&L.alphaTest>0||L.alphaToCoverage===!0){const O=Z.uuid,te=L.uuid;let C=x[O];if(C===void 0){C={};x[O]=C}let k=C[te];if(k===void 0){k=Z.clone();C[te]=k;L.addEventListener("dispose",g)}Z=k}}Z.visible=L.visible;Z.wireframe=L.wireframe;if(p===VSMShadowMap)Z.side=L.shadowSide!==null?L.shadowSide:L.side;else Z.side=L.shadowSide!==null?L.shadowSide:N[L.side];Z.alphaMap=L.alphaMap;Z.alphaTest=L.alphaToCoverage===!0?0.5:L.alphaTest;Z.map=L.map;Z.clipShadows=L.clipShadows;Z.clippingPlanes=L.clippingPlanes;Z.clipIntersection=L.clipIntersection;Z.displacementMap=L.displacementMap;Z.displacementScale=L.displacementScale;Z.displacementBias=L.displacementBias;Z.wireframeLinewidth=L.wireframeLinewidth;Z.linewidth=L.linewidth;if(c.isPointLight===!0&&Z.isMeshDistanceMaterial===!0){const O=e.properties.get(Z);O.light=c}return Z}function m(A,L,c,p,Z){if(A.visible===!1)return;if(A.layers.test(L.layers)&&(A.isMesh||A.isLine||A.isPoints)){if((A.castShadow||A.receiveShadow&&Z===VSMShadowMap)&&(!A.frustumCulled||A.intersectsFrustum(i))){A.modelViewMatrix.multiplyMatrices(c.matrixWorldInverse,A.matrixWorld);const te=n.update(A),C=A.material;if(Array.isArray(C)){const k=te.groups;for(let Q=0,G=k.length;Q<G;Q++){const pe=k[Q],Y=C[pe.materialIndex];if(Y&&Y.visible){const J=X(A,Y,p,Z);A.onBeforeShadow(e,A,L,c,te,J,pe);e.renderBufferDirect(c,null,te,J,A,pe);A.onAfterShadow(e,A,L,c,te,J,pe)}}}else if(C.visible){const k=X(A,C,p,Z);A.onBeforeShadow(e,A,L,c,te,k,null);e.renderBufferDirect(c,null,te,k,A,null);A.onAfterShadow(e,A,L,c,te,k,null)}}}const O=A.children;for(let te=0,C=O.length;te<C;te++)m(O[te],L,c,p,Z)}function g(A){A.target.removeEventListener("dispose",g);for(const c in x){const p=x[c],Z=A.target.uuid;if(Z in p){p[Z].dispose();delete p[Z]}}}}function Ps(e,n){function t(){let M=!1;const ae=new Vector4;let H=null;const oe=new Vector4(0,0,0,0);return{setMask:function(he){if(H!==he&&!M){e.colorMask(he,he,he,he);H=he}},setLocked:function(he){M=he},setClear:function(he,q,ce,Ce,ke){if(ke===!0){he*=Ce;q*=Ce;ce*=Ce}ae.set(he,q,ce,Ce);if(oe.equals(ae)===!1){e.clearColor(he,q,ce,Ce);oe.copy(ae)}},reset:function(){M=!1;H=null;oe.set(-1,0,0,0)}}}function i(){let M=!1,ae=!1,H=null,oe=null,he=null;return{setReversed:function(q){if(ae!==q){const ce=n.get("EXT_clip_control");if(q)ce.clipControlEXT(ce.LOWER_LEFT_EXT,ce.ZERO_TO_ONE_EXT);else ce.clipControlEXT(ce.LOWER_LEFT_EXT,ce.NEGATIVE_ONE_TO_ONE_EXT);ae=q;const Ce=he;he=null;this.setClear(Ce)}},getReversed:function(){return ae},setTest:function(q){if(q)re(e.DEPTH_TEST);else Re(e.DEPTH_TEST)},setMask:function(q){if(H!==q&&!M){e.depthMask(q);H=q}},setFunc:function(q){if(ae)q=zn[q];if(oe!==q){switch(q){case NeverDepth:e.depthFunc(e.NEVER);break;case AlwaysDepth:e.depthFunc(e.ALWAYS);break;case LessDepth:e.depthFunc(e.LESS);break;case LessEqualDepth:e.depthFunc(e.LEQUAL);break;case EqualDepth:e.depthFunc(e.EQUAL);break;case GreaterEqualDepth:e.depthFunc(e.GEQUAL);break;case GreaterDepth:e.depthFunc(e.GREATER);break;case NotEqualDepth:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}oe=q}},setLocked:function(q){M=q},setClear:function(q){if(he!==q){he=q;if(ae)q=1-q;e.clearDepth(q)}},reset:function(){M=!1;H=null;oe=null;he=null;ae=!1}}}function f(){let M=!1,ae=null,H=null,oe=null,he=null,q=null,ce=null,Ce=null,ke=null;return{setTest:function(Be){if(!M)if(Be)re(e.STENCIL_TEST);else Re(e.STENCIL_TEST)},setMask:function(Be){if(ae!==Be&&!M){e.stencilMask(Be);ae=Be}},setFunc:function(Be,ct,ut){if(H!==Be||oe!==ct||he!==ut){e.stencilFunc(Be,ct,ut);H=Be;oe=ct;he=ut}},setOp:function(Be,ct,ut){if(q!==Be||ce!==ct||Ce!==ut){e.stencilOp(Be,ct,ut);q=Be;ce=ct;Ce=ut}},setLocked:function(Be){M=Be},setClear:function(Be){if(ke!==Be){e.clearStencil(Be);ke=Be}},reset:function(){M=!1;ae=null;H=null;oe=null;he=null;q=null;ce=null;Ce=null;ke=null}}}const l=new t,u=new i,_=new f,F=new WeakMap,x=new WeakMap;let y={},N={},h={},T=new WeakMap,P=[],W=null,d=!1,o=null,U=null,X=null,m=null,g=null,A=null,L=null,c=new Color(0,0,0),p=0,Z=!1,D=null,O=null,te=null,C=null,k=null;const Q=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let G=!1,pe=0;const Y=e.getParameter(e.VERSION);if(Y.indexOf("WebGL")!==-1){pe=parseFloat(/^WebGL (\d)/.exec(Y)[1]);G=pe>=1}else if(Y.indexOf("OpenGL ES")!==-1){pe=parseFloat(/^OpenGL ES (\d)/.exec(Y)[1]);G=pe>=2}let J=null,ee={};const Pe=e.getParameter(e.SCISSOR_BOX),Ae=e.getParameter(e.VIEWPORT),Ze=new Vector4().fromArray(Pe),we=new Vector4().fromArray(Ae);function V(M,ae,H,oe){const he=new Uint8Array(4),q=e.createTexture();e.bindTexture(M,q);e.texParameteri(M,e.TEXTURE_MIN_FILTER,e.NEAREST);e.texParameteri(M,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let ce=0;ce<H;ce++)if(M===e.TEXTURE_3D||M===e.TEXTURE_2D_ARRAY)e.texImage3D(ae,0,e.RGBA,1,1,oe,0,e.RGBA,e.UNSIGNED_BYTE,he);else e.texImage2D(ae+ce,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,he);return q}const ie={};ie[e.TEXTURE_2D]=V(e.TEXTURE_2D,e.TEXTURE_2D,1);ie[e.TEXTURE_CUBE_MAP]=V(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6);ie[e.TEXTURE_2D_ARRAY]=V(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1);ie[e.TEXTURE_3D]=V(e.TEXTURE_3D,e.TEXTURE_3D,1,1);l.setClear(0,0,0,1);u.setClear(1);_.setClear(0);re(e.DEPTH_TEST);u.setFunc(LessEqualDepth);nt(!1);Xe(CullFaceBack);re(e.CULL_FACE);He(NoBlending);function re(M){if(y[M]!==!0){e.enable(M);y[M]=!0}}function Re(M){if(y[M]!==!1){e.disable(M);y[M]=!1}}function be(M,ae){if(h[M]!==ae){e.bindFramebuffer(M,ae);h[M]=ae;if(M===e.DRAW_FRAMEBUFFER)h[e.FRAMEBUFFER]=ae;if(M===e.FRAMEBUFFER)h[e.DRAW_FRAMEBUFFER]=ae;return!0}return!1}function Te(M,ae){let H=P,oe=!1;if(M){H=T.get(ae);if(H===void 0){H=[];T.set(ae,H)}const he=M.textures;if(H.length!==he.length||H[0]!==e.COLOR_ATTACHMENT0){for(let q=0,ce=he.length;q<ce;q++)H[q]=e.COLOR_ATTACHMENT0+q;H.length=he.length;oe=!0}}else if(H[0]!==e.BACK){H[0]=e.BACK;oe=!0}if(oe)e.drawBuffers(H)}function Qe(M){if(W!==M){e.useProgram(M);W=M;return!0}return!1}const De={[AddEquation]:e.FUNC_ADD,[SubtractEquation]:e.FUNC_SUBTRACT,[ReverseSubtractEquation]:e.FUNC_REVERSE_SUBTRACT};De[MinEquation]=e.MIN;De[MaxEquation]=e.MAX;const Ie={[ZeroFactor]:e.ZERO,[OneFactor]:e.ONE,[SrcColorFactor]:e.SRC_COLOR,[SrcAlphaFactor]:e.SRC_ALPHA,[SrcAlphaSaturateFactor]:e.SRC_ALPHA_SATURATE,[DstColorFactor]:e.DST_COLOR,[DstAlphaFactor]:e.DST_ALPHA,[OneMinusSrcColorFactor]:e.ONE_MINUS_SRC_COLOR,[OneMinusSrcAlphaFactor]:e.ONE_MINUS_SRC_ALPHA,[OneMinusDstColorFactor]:e.ONE_MINUS_DST_COLOR,[OneMinusDstAlphaFactor]:e.ONE_MINUS_DST_ALPHA,[ConstantColorFactor]:e.CONSTANT_COLOR,[OneMinusConstantColorFactor]:e.ONE_MINUS_CONSTANT_COLOR,[ConstantAlphaFactor]:e.CONSTANT_ALPHA,[OneMinusConstantAlphaFactor]:e.ONE_MINUS_CONSTANT_ALPHA};function He(M,ae,H,oe,he,q,ce,Ce,ke,Be){if(M===NoBlending){if(d===!0){Re(e.BLEND);d=!1}return}if(d===!1){re(e.BLEND);d=!0}if(M!==CustomBlending){if(M!==o||Be!==Z){if(U!==AddEquation||g!==AddEquation){e.blendEquation(e.FUNC_ADD);U=AddEquation;g=AddEquation}if(Be)switch(M){case NormalBlending:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case AdditiveBlending:e.blendFunc(e.ONE,e.ONE);break;case SubtractiveBlending:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case MultiplyBlending:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:error("WebGLState: Invalid blending: ",M);break}else switch(M){case NormalBlending:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case AdditiveBlending:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case SubtractiveBlending:error("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case MultiplyBlending:error("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:error("WebGLState: Invalid blending: ",M);break}X=null;m=null;A=null;L=null;c.set(0,0,0);p=0;o=M;Z=Be}return}he=he||ae;q=q||H;ce=ce||oe;if(ae!==U||he!==g){e.blendEquationSeparate(De[ae],De[he]);U=ae;g=he}if(H!==X||oe!==m||q!==A||ce!==L){e.blendFuncSeparate(Ie[H],Ie[oe],Ie[q],Ie[ce]);X=H;m=oe;A=q;L=ce}if(Ce.equals(c)===!1||ke!==p){e.blendColor(Ce.r,Ce.g,Ce.b,ke);c.copy(Ce);p=ke}o=M;Z=!1}function Ne(M,ae){M.side===DoubleSide?Re(e.CULL_FACE):re(e.CULL_FACE);let H=M.side===BackSide;if(ae)H=!H;nt(H);M.blending===NormalBlending&&M.transparent===!1?He(NoBlending):He(M.blending,M.blendEquation,M.blendSrc,M.blendDst,M.blendEquationAlpha,M.blendSrcAlpha,M.blendDstAlpha,M.blendColor,M.blendAlpha,M.premultipliedAlpha);u.setFunc(M.depthFunc);u.setTest(M.depthTest);u.setMask(M.depthWrite);l.setMask(M.colorWrite);const oe=M.stencilWrite;_.setTest(oe);if(oe){_.setMask(M.stencilWriteMask);_.setFunc(M.stencilFunc,M.stencilRef,M.stencilFuncMask);_.setOp(M.stencilFail,M.stencilZFail,M.stencilZPass)}Je(M.polygonOffset,M.polygonOffsetFactor,M.polygonOffsetUnits);M.alphaToCoverage===!0?re(e.SAMPLE_ALPHA_TO_COVERAGE):Re(e.SAMPLE_ALPHA_TO_COVERAGE)}function nt(M){if(D!==M){if(M)e.frontFace(e.CW);else e.frontFace(e.CCW);D=M}}function Xe(M){if(M!==CullFaceNone){re(e.CULL_FACE);if(M!==O)if(M===CullFaceBack)e.cullFace(e.BACK);else if(M===CullFaceFront)e.cullFace(e.FRONT);else e.cullFace(e.FRONT_AND_BACK)}else Re(e.CULL_FACE);O=M}function at(M){if(M!==te){if(G)e.lineWidth(M);te=M}}function Je(M,ae,H){if(M){re(e.POLYGON_OFFSET_FILL);if(C!==ae||k!==H){C=ae;k=H;if(u.getReversed())ae=-ae;e.polygonOffset(ae,H)}}else Re(e.POLYGON_OFFSET_FILL)}function je(M){if(M)re(e.SCISSOR_TEST);else Re(e.SCISSOR_TEST)}function E(M){if(M===void 0)M=e.TEXTURE0+Q-1;if(J!==M){e.activeTexture(M);J=M}}function ot(M,ae,H){if(H===void 0)if(J===null)H=e.TEXTURE0+Q-1;else H=J;let oe=ee[H];if(oe===void 0){oe={type:void 0,texture:void 0};ee[H]=oe}if(oe.type!==M||oe.texture!==ae){if(J!==H){e.activeTexture(H);J=H}e.bindTexture(M,ae||ie[M]);oe.type=M;oe.texture=ae}}function Oe(){const M=ee[J];if(M!==void 0&&M.type!==void 0){e.bindTexture(M.type,null);M.type=void 0;M.texture=void 0}}function Ye(){try{e.compressedTexImage2D(...arguments)}catch(M){error("WebGLState:",M)}}function s(){try{e.compressedTexImage3D(...arguments)}catch(M){error("WebGLState:",M)}}function r(){try{e.texSubImage2D(...arguments)}catch(M){error("WebGLState:",M)}}function v(){try{e.texSubImage3D(...arguments)}catch(M){error("WebGLState:",M)}}function w(){try{e.compressedTexSubImage2D(...arguments)}catch(M){error("WebGLState:",M)}}function K(){try{e.compressedTexSubImage3D(...arguments)}catch(M){error("WebGLState:",M)}}function ne(){try{e.texStorage2D(...arguments)}catch(M){error("WebGLState:",M)}}function se(){try{e.texStorage3D(...arguments)}catch(M){error("WebGLState:",M)}}function B(){try{e.texImage2D(...arguments)}catch(M){error("WebGLState:",M)}}function z(){try{e.texImage3D(...arguments)}catch(M){error("WebGLState:",M)}}function ue(M){if(N[M]!==void 0)return N[M];else return e.getParameter(M)}function Ee(M,ae){if(N[M]!==ae){e.pixelStorei(M,ae);N[M]=ae}}function le(M){if(Ze.equals(M)===!1){e.scissor(M.x,M.y,M.z,M.w);Ze.copy(M)}}function j(M){if(we.equals(M)===!1){e.viewport(M.x,M.y,M.z,M.w);we.copy(M)}}function Me(M,ae){let H=x.get(ae);if(H===void 0){H=new WeakMap;x.set(ae,H)}let oe=H.get(M);if(oe===void 0){oe=e.getUniformBlockIndex(ae,M.name);H.set(M,oe)}}function xe(M,ae){const oe=x.get(ae).get(M);if(F.get(ae)!==oe){e.uniformBlockBinding(ae,oe,M.__bindingPointIndex);F.set(ae,oe)}}function Fe(){e.disable(e.BLEND);e.disable(e.CULL_FACE);e.disable(e.DEPTH_TEST);e.disable(e.POLYGON_OFFSET_FILL);e.disable(e.SCISSOR_TEST);e.disable(e.STENCIL_TEST);e.disable(e.SAMPLE_ALPHA_TO_COVERAGE);e.blendEquation(e.FUNC_ADD);e.blendFunc(e.ONE,e.ZERO);e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO);e.blendColor(0,0,0,0);e.colorMask(!0,!0,!0,!0);e.clearColor(0,0,0,0);e.depthMask(!0);e.depthFunc(e.LESS);u.setReversed(!1);e.clearDepth(1);e.stencilMask(4294967295);e.stencilFunc(e.ALWAYS,0,4294967295);e.stencilOp(e.KEEP,e.KEEP,e.KEEP);e.clearStencil(0);e.cullFace(e.BACK);e.frontFace(e.CCW);e.polygonOffset(0,0);e.activeTexture(e.TEXTURE0);e.bindFramebuffer(e.FRAMEBUFFER,null);e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null);e.bindFramebuffer(e.READ_FRAMEBUFFER,null);e.useProgram(null);e.lineWidth(1);e.scissor(0,0,e.canvas.width,e.canvas.height);e.viewport(0,0,e.canvas.width,e.canvas.height);e.pixelStorei(e.PACK_ALIGNMENT,4);e.pixelStorei(e.UNPACK_ALIGNMENT,4);e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1);e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1);e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL);e.pixelStorei(e.PACK_ROW_LENGTH,0);e.pixelStorei(e.PACK_SKIP_PIXELS,0);e.pixelStorei(e.PACK_SKIP_ROWS,0);e.pixelStorei(e.UNPACK_ROW_LENGTH,0);e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0);e.pixelStorei(e.UNPACK_SKIP_PIXELS,0);e.pixelStorei(e.UNPACK_SKIP_ROWS,0);e.pixelStorei(e.UNPACK_SKIP_IMAGES,0);y={};N={};J=null;ee={};h={};T=new WeakMap;P=[];W=null;d=!1;o=null;U=null;X=null;m=null;g=null;A=null;L=null;c=new Color(0,0,0);p=0;Z=!1;D=null;O=null;te=null;C=null;k=null;Ze.set(0,0,e.canvas.width,e.canvas.height);we.set(0,0,e.canvas.width,e.canvas.height);l.reset();u.reset();_.reset()}return{buffers:{color:l,depth:u,stencil:_},enable:re,disable:Re,bindFramebuffer:be,drawBuffers:Te,useProgram:Qe,setBlending:He,setMaterial:Ne,setFlipSided:nt,setCullFace:Xe,setLineWidth:at,setPolygonOffset:Je,setScissorTest:je,activeTexture:E,bindTexture:ot,unbindTexture:Oe,compressedTexImage2D:Ye,compressedTexImage3D:s,texImage2D:B,texImage3D:z,pixelStorei:Ee,getParameter:ue,updateUBOMapping:Me,uniformBlockBinding:xe,texStorage2D:ne,texStorage3D:se,texSubImage2D:r,texSubImage3D:v,compressedTexSubImage2D:w,compressedTexSubImage3D:K,scissor:le,viewport:j,reset:Fe}}function Ls(e,n,t,i,f,l,u){const _=n.has("WEBGL_multisampled_render_to_texture")?n.get("WEBGL_multisampled_render_to_texture"):null,F=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),x=new Vector2,y=new WeakMap,N=new Set;let h;const T=new WeakMap;let P=!1;try{P=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch(s){}function W(s,r){return P?new OffscreenCanvas(s,r):Xn("canvas")}function d(s,r,v){let w=1;const K=Ye(s);if(K.width>v||K.height>v)w=v/Math.max(K.width,K.height);if(w<1)if(typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap||typeof VideoFrame<"u"&&s instanceof VideoFrame){const ne=Math.floor(w*K.width),se=Math.floor(w*K.height);if(h===void 0)h=W(ne,se);const B=r?W(ne,se):h;B.width=ne;B.height=se;B.getContext("2d").drawImage(s,0,0,ne,se);warn("WebGLRenderer: Texture has been resized from ("+K.width+"x"+K.height+") to ("+ne+"x"+se+").");return B}else{if("data"in s)warn("WebGLRenderer: Image in DataTexture is too big ("+K.width+"x"+K.height+").");return s}return s}function o(s){return s.generateMipmaps}function U(s){e.generateMipmap(s)}function X(s){if(s.isWebGLCubeRenderTarget)return e.TEXTURE_CUBE_MAP;if(s.isWebGL3DRenderTarget)return e.TEXTURE_3D;if(s.isWebGLArrayRenderTarget||s.isCompressedArrayTexture)return e.TEXTURE_2D_ARRAY;return e.TEXTURE_2D}function m(s,r,v,w,K,ne=!1){if(s!==null){if(e[s]!==void 0)return e[s];warn("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+s+"'")}let se;if(w){se=n.get("EXT_texture_norm16");if(!se)warn("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension")}let B=r;if(r===e.RED){if(v===e.FLOAT)B=e.R32F;if(v===e.HALF_FLOAT)B=e.R16F;if(v===e.UNSIGNED_BYTE)B=e.R8;if(v===e.UNSIGNED_SHORT&&se)B=se.R16_EXT;if(v===e.SHORT&&se)B=se.R16_SNORM_EXT}if(r===e.RED_INTEGER){if(v===e.UNSIGNED_BYTE)B=e.R8UI;if(v===e.UNSIGNED_SHORT)B=e.R16UI;if(v===e.UNSIGNED_INT)B=e.R32UI;if(v===e.BYTE)B=e.R8I;if(v===e.SHORT)B=e.R16I;if(v===e.INT)B=e.R32I}if(r===e.RG){if(v===e.FLOAT)B=e.RG32F;if(v===e.HALF_FLOAT)B=e.RG16F;if(v===e.UNSIGNED_BYTE)B=e.RG8;if(v===e.UNSIGNED_SHORT&&se)B=se.RG16_EXT;if(v===e.SHORT&&se)B=se.RG16_SNORM_EXT}if(r===e.RG_INTEGER){if(v===e.UNSIGNED_BYTE)B=e.RG8UI;if(v===e.UNSIGNED_SHORT)B=e.RG16UI;if(v===e.UNSIGNED_INT)B=e.RG32UI;if(v===e.BYTE)B=e.RG8I;if(v===e.SHORT)B=e.RG16I;if(v===e.INT)B=e.RG32I}if(r===e.RGB_INTEGER){if(v===e.UNSIGNED_BYTE)B=e.RGB8UI;if(v===e.UNSIGNED_SHORT)B=e.RGB16UI;if(v===e.UNSIGNED_INT)B=e.RGB32UI;if(v===e.BYTE)B=e.RGB8I;if(v===e.SHORT)B=e.RGB16I;if(v===e.INT)B=e.RGB32I}if(r===e.RGBA_INTEGER){if(v===e.UNSIGNED_BYTE)B=e.RGBA8UI;if(v===e.UNSIGNED_SHORT)B=e.RGBA16UI;if(v===e.UNSIGNED_INT)B=e.RGBA32UI;if(v===e.BYTE)B=e.RGBA8I;if(v===e.SHORT)B=e.RGBA16I;if(v===e.INT)B=e.RGBA32I}if(r===e.RGB){if(v===e.UNSIGNED_SHORT&&se)B=se.RGB16_EXT;if(v===e.SHORT&&se)B=se.RGB16_SNORM_EXT;if(v===e.UNSIGNED_INT_5_9_9_9_REV)B=e.RGB9_E5;if(v===e.UNSIGNED_INT_10F_11F_11F_REV)B=e.R11F_G11F_B10F}if(r===e.RGBA){const z=ne?LinearTransfer:ColorManagement.getTransfer(K);if(v===e.FLOAT)B=e.RGBA32F;if(v===e.HALF_FLOAT)B=e.RGBA16F;if(v===e.UNSIGNED_BYTE)B=z===SRGBTransfer?e.SRGB8_ALPHA8:e.RGBA8;if(v===e.UNSIGNED_SHORT&&se)B=se.RGBA16_EXT;if(v===e.SHORT&&se)B=se.RGBA16_SNORM_EXT;if(v===e.UNSIGNED_SHORT_4_4_4_4)B=e.RGBA4;if(v===e.UNSIGNED_SHORT_5_5_5_1)B=e.RGB5_A1}if(B===e.R16F||B===e.R32F||B===e.RG16F||B===e.RG32F||B===e.RGBA16F||B===e.RGBA32F)n.get("EXT_color_buffer_float");return B}function g(s,r){let v;if(s){if(r===null||r===UnsignedIntType||r===UnsignedInt248Type)v=e.DEPTH24_STENCIL8;else if(r===FloatType)v=e.DEPTH32F_STENCIL8;else if(r===UnsignedShortType){v=e.DEPTH24_STENCIL8;warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")}}else if(r===null||r===UnsignedIntType||r===UnsignedInt248Type)v=e.DEPTH_COMPONENT24;else if(r===FloatType)v=e.DEPTH_COMPONENT32F;else if(r===UnsignedShortType)v=e.DEPTH_COMPONENT16;return v}function A(s,r){if(o(s)===!0||s.isFramebufferTexture&&s.minFilter!==NearestFilter&&s.minFilter!==LinearFilter)return Math.log2(Math.max(r.width,r.height))+1;else if(s.mipmaps!==void 0&&s.mipmaps.length>0)return s.mipmaps.length;else if(s.isCompressedTexture&&Array.isArray(s.image))return r.mipmaps.length;else return 1}function L(s){const r=s.target;r.removeEventListener("dispose",L);p(r);if(r.isVideoTexture)y.delete(r);if(r.isHTMLTexture)N.delete(r)}function c(s){const r=s.target;r.removeEventListener("dispose",c);D(r)}function p(s){const r=i.get(s);if(r.__webglInit===void 0)return;const v=s.source,w=T.get(v);if(w){const K=w[r.__cacheKey];K.usedTimes--;if(K.usedTimes===0)Z(s);if(Object.keys(w).length===0)T.delete(v)}i.remove(s)}function Z(s){const r=i.get(s);e.deleteTexture(r.__webglTexture);const v=s.source,w=T.get(v);delete w[r.__cacheKey];u.memory.textures--}function D(s){const r=i.get(s);if(s.depthTexture){s.depthTexture.dispose();i.remove(s.depthTexture)}if(s.isWebGLCubeRenderTarget)for(let w=0;w<6;w++){if(Array.isArray(r.__webglFramebuffer[w]))for(let K=0;K<r.__webglFramebuffer[w].length;K++)e.deleteFramebuffer(r.__webglFramebuffer[w][K]);else e.deleteFramebuffer(r.__webglFramebuffer[w]);if(r.__webglDepthbuffer)e.deleteRenderbuffer(r.__webglDepthbuffer[w])}else{if(Array.isArray(r.__webglFramebuffer))for(let w=0;w<r.__webglFramebuffer.length;w++)e.deleteFramebuffer(r.__webglFramebuffer[w]);else e.deleteFramebuffer(r.__webglFramebuffer);if(r.__webglDepthbuffer)e.deleteRenderbuffer(r.__webglDepthbuffer);if(r.__webglMultisampledFramebuffer)e.deleteFramebuffer(r.__webglMultisampledFramebuffer);if(r.__webglColorRenderbuffer){for(let w=0;w<r.__webglColorRenderbuffer.length;w++)if(r.__webglColorRenderbuffer[w])e.deleteRenderbuffer(r.__webglColorRenderbuffer[w])}if(r.__webglDepthRenderbuffer)e.deleteRenderbuffer(r.__webglDepthRenderbuffer)}const v=s.textures;for(let w=0,K=v.length;w<K;w++){const ne=i.get(v[w]);if(ne.__webglTexture){e.deleteTexture(ne.__webglTexture);u.memory.textures--}i.remove(v[w])}i.remove(s)}let O=0;function te(){O=0}function C(){return O}function k(s){O=s}function Q(){const s=O;if(s>=f.maxTextures)warn("WebGLTextures: Trying to use "+(s+1)+" texture units while this GPU supports only "+f.maxTextures);O+=1;return s}function G(s){const r=[];r.push(s.wrapS);r.push(s.wrapT);r.push(s.wrapR||0);r.push(s.magFilter);r.push(s.minFilter);r.push(s.anisotropy);r.push(s.internalFormat);r.push(s.format);r.push(s.type);r.push(s.generateMipmaps);r.push(s.premultiplyAlpha);r.push(s.flipY);r.push(s.unpackAlignment);r.push(s.colorSpace);return r.join()}function pe(s,r){const v=i.get(s);if(s.isVideoTexture)ot(s);if(s.isRenderTargetTexture===!1&&s.isExternalTexture!==!0&&s.version>0&&v.__version!==s.version){const w=s.image;if(w===null)warn("WebGLRenderer: Texture marked for update but no image data found.");else if(w.complete===!1)warn("WebGLRenderer: Texture marked for update but image is incomplete");else{Re(v,s,r);return}}else if(s.isExternalTexture)v.__webglTexture=s.sourceTexture?s.sourceTexture:null;t.bindTexture(e.TEXTURE_2D,v.__webglTexture,e.TEXTURE0+r)}function Y(s,r){const v=i.get(s);if(s.isRenderTargetTexture===!1&&s.version>0&&v.__version!==s.version){Re(v,s,r);return}else if(s.isExternalTexture)v.__webglTexture=s.sourceTexture?s.sourceTexture:null;t.bindTexture(e.TEXTURE_2D_ARRAY,v.__webglTexture,e.TEXTURE0+r)}function J(s,r){const v=i.get(s);if(s.isRenderTargetTexture===!1&&s.version>0&&v.__version!==s.version){Re(v,s,r);return}t.bindTexture(e.TEXTURE_3D,v.__webglTexture,e.TEXTURE0+r)}function ee(s,r){const v=i.get(s);if(s.isCubeDepthTexture!==!0&&s.version>0&&v.__version!==s.version){be(v,s,r);return}t.bindTexture(e.TEXTURE_CUBE_MAP,v.__webglTexture,e.TEXTURE0+r)}const Pe={[RepeatWrapping]:e.REPEAT,[ClampToEdgeWrapping]:e.CLAMP_TO_EDGE,[MirroredRepeatWrapping]:e.MIRRORED_REPEAT},Ae={[NearestFilter]:e.NEAREST,[NearestMipmapNearestFilter]:e.NEAREST_MIPMAP_NEAREST,[NearestMipmapLinearFilter]:e.NEAREST_MIPMAP_LINEAR,[LinearFilter]:e.LINEAR,[LinearMipmapNearestFilter]:e.LINEAR_MIPMAP_NEAREST,[LinearMipmapLinearFilter]:e.LINEAR_MIPMAP_LINEAR},Ze={[NeverCompare]:e.NEVER,[AlwaysCompare]:e.ALWAYS,[LessCompare]:e.LESS,[LessEqualCompare]:e.LEQUAL,[EqualCompare]:e.EQUAL,[GreaterEqualCompare]:e.GEQUAL,[GreaterCompare]:e.GREATER,[NotEqualCompare]:e.NOTEQUAL};function we(s,r){if(r.type===FloatType&&n.has("OES_texture_float_linear")===!1&&(r.magFilter===LinearFilter||r.magFilter===LinearMipmapNearestFilter||r.magFilter===NearestMipmapLinearFilter||r.magFilter===LinearMipmapLinearFilter||r.minFilter===LinearFilter||r.minFilter===LinearMipmapNearestFilter||r.minFilter===NearestMipmapLinearFilter||r.minFilter===LinearMipmapLinearFilter))warn("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.");e.texParameteri(s,e.TEXTURE_WRAP_S,Pe[r.wrapS]);e.texParameteri(s,e.TEXTURE_WRAP_T,Pe[r.wrapT]);if(s===e.TEXTURE_3D||s===e.TEXTURE_2D_ARRAY)e.texParameteri(s,e.TEXTURE_WRAP_R,Pe[r.wrapR]);e.texParameteri(s,e.TEXTURE_MAG_FILTER,Ae[r.magFilter]);e.texParameteri(s,e.TEXTURE_MIN_FILTER,Ae[r.minFilter]);if(r.compareFunction){e.texParameteri(s,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE);e.texParameteri(s,e.TEXTURE_COMPARE_FUNC,Ze[r.compareFunction])}if(n.has("EXT_texture_filter_anisotropic")===!0){if(r.magFilter===NearestFilter)return;if(r.minFilter!==NearestMipmapLinearFilter&&r.minFilter!==LinearMipmapLinearFilter)return;if(r.type===FloatType&&n.has("OES_texture_float_linear")===!1)return;if(r.anisotropy>1||i.get(r).__currentAnisotropy){const v=n.get("EXT_texture_filter_anisotropic");e.texParameterf(s,v.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(r.anisotropy,f.getMaxAnisotropy()));i.get(r).__currentAnisotropy=r.anisotropy}}}function V(s,r){let v=!1;if(s.__webglInit===void 0){s.__webglInit=!0;r.addEventListener("dispose",L)}const w=r.source;let K=T.get(w);if(K===void 0){K={};T.set(w,K)}const ne=G(r);if(ne!==s.__cacheKey){if(K[ne]===void 0){K[ne]={texture:e.createTexture(),usedTimes:0};u.memory.textures++;v=!0}K[ne].usedTimes++;const se=K[s.__cacheKey];if(se!==void 0){K[s.__cacheKey].usedTimes--;if(se.usedTimes===0)Z(r)}s.__cacheKey=ne;s.__webglTexture=K[ne].texture}return v}function ie(s,r,v){return Math.floor(Math.floor(s/v)/r)}function re(s,r,v,w){const K=4,ne=s.updateRanges;if(ne.length===0)t.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,v,w,r.data);else{ne.sort((Ee,le)=>Ee.start-le.start);let se=0;for(let Ee=1;Ee<ne.length;Ee++){const le=ne[se],j=ne[Ee],Me=le.start+le.count,xe=ie(j.start,r.width,K),Fe=ie(le.start,r.width,K);if(j.start<=Me+1&&xe===Fe&&ie(j.start+j.count-1,r.width,K)===xe)le.count=Math.max(le.count,j.start+j.count-le.start);else{++se;ne[se]=j}}ne.length=se+1;const B=t.getParameter(e.UNPACK_ROW_LENGTH),z=t.getParameter(e.UNPACK_SKIP_PIXELS),ue=t.getParameter(e.UNPACK_SKIP_ROWS);t.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let Ee=0,le=ne.length;Ee<le;Ee++){const j=ne[Ee],Me=Math.floor(j.start/K),xe=Math.ceil(j.count/K),Fe=Me%r.width,M=Math.floor(Me/r.width),ae=xe,H=1;t.pixelStorei(e.UNPACK_SKIP_PIXELS,Fe);t.pixelStorei(e.UNPACK_SKIP_ROWS,M);t.texSubImage2D(e.TEXTURE_2D,0,Fe,M,ae,H,v,w,r.data)}s.clearUpdateRanges();t.pixelStorei(e.UNPACK_ROW_LENGTH,B);t.pixelStorei(e.UNPACK_SKIP_PIXELS,z);t.pixelStorei(e.UNPACK_SKIP_ROWS,ue)}}function Re(s,r,v){let w=e.TEXTURE_2D;if(r.isDataArrayTexture||r.isCompressedArrayTexture)w=e.TEXTURE_2D_ARRAY;if(r.isData3DTexture)w=e.TEXTURE_3D;const K=V(s,r),ne=r.source;t.bindTexture(w,s.__webglTexture,e.TEXTURE0+v);const se=i.get(ne);if(ne.version!==se.__version||K===!0){t.activeTexture(e.TEXTURE0+v);if((typeof ImageBitmap<"u"&&r.image instanceof ImageBitmap)===!1){const H=ColorManagement.getPrimaries(ColorManagement.workingColorSpace),oe=r.colorSpace===NoColorSpace?null:ColorManagement.getPrimaries(r.colorSpace),he=r.colorSpace===NoColorSpace||H===oe?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,r.flipY);t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,r.premultiplyAlpha);t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,he)}t.pixelStorei(e.UNPACK_ALIGNMENT,r.unpackAlignment);let z=d(r.image,!1,f.maxTextureSize);z=Oe(r,z);const ue=l.convert(r.format,r.colorSpace),Ee=l.convert(r.type);let le=m(r.internalFormat,ue,Ee,r.normalized,r.colorSpace,r.isVideoTexture);we(w,r);let j;const Me=r.mipmaps,xe=r.isVideoTexture!==!0,Fe=se.__version===void 0||K===!0,M=ne.dataReady,ae=A(r,z);if(r.isDepthTexture){le=g(r.format===DepthStencilFormat,r.type);if(Fe)if(xe)t.texStorage2D(e.TEXTURE_2D,1,le,z.width,z.height);else t.texImage2D(e.TEXTURE_2D,0,le,z.width,z.height,0,ue,Ee,null)}else if(r.isDataTexture)if(Me.length>0){if(xe&&Fe)t.texStorage2D(e.TEXTURE_2D,ae,le,Me[0].width,Me[0].height);for(let H=0,oe=Me.length;H<oe;H++){j=Me[H];if(xe){if(M)t.texSubImage2D(e.TEXTURE_2D,H,0,0,j.width,j.height,ue,Ee,j.data)}else t.texImage2D(e.TEXTURE_2D,H,le,j.width,j.height,0,ue,Ee,j.data)}r.generateMipmaps=!1}else if(xe){if(Fe)t.texStorage2D(e.TEXTURE_2D,ae,le,z.width,z.height);if(M)re(r,z,ue,Ee)}else t.texImage2D(e.TEXTURE_2D,0,le,z.width,z.height,0,ue,Ee,z.data);else if(r.isCompressedTexture)if(r.isCompressedArrayTexture){if(xe&&Fe)t.texStorage3D(e.TEXTURE_2D_ARRAY,ae,le,Me[0].width,Me[0].height,z.depth);for(let H=0,oe=Me.length;H<oe;H++){j=Me[H];if(r.format!==RGBAFormat)if(ue!==null)if(xe){if(M)if(r.layerUpdates.size>0){const he=tn(j.width,j.height,r.format,r.type);for(const q of r.layerUpdates){const ce=j.data.subarray(q*he/j.data.BYTES_PER_ELEMENT,(q+1)*he/j.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,H,0,0,q,j.width,j.height,1,ue,ce)}}else t.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,H,0,0,0,j.width,j.height,z.depth,ue,j.data)}else t.compressedTexImage3D(e.TEXTURE_2D_ARRAY,H,le,j.width,j.height,z.depth,0,j.data,0,0);else warn("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(xe){if(M)t.texSubImage3D(e.TEXTURE_2D_ARRAY,H,0,0,0,j.width,j.height,z.depth,ue,Ee,j.data)}else t.texImage3D(e.TEXTURE_2D_ARRAY,H,le,j.width,j.height,z.depth,0,ue,Ee,j.data)}if(r.layerUpdates.size>0)r.clearLayerUpdates()}else{if(xe&&Fe)t.texStorage2D(e.TEXTURE_2D,ae,le,Me[0].width,Me[0].height);for(let H=0,oe=Me.length;H<oe;H++){j=Me[H];if(r.format!==RGBAFormat)if(ue!==null)if(xe){if(M)t.compressedTexSubImage2D(e.TEXTURE_2D,H,0,0,j.width,j.height,ue,j.data)}else t.compressedTexImage2D(e.TEXTURE_2D,H,le,j.width,j.height,0,j.data);else warn("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else if(xe){if(M)t.texSubImage2D(e.TEXTURE_2D,H,0,0,j.width,j.height,ue,Ee,j.data)}else t.texImage2D(e.TEXTURE_2D,H,le,j.width,j.height,0,ue,Ee,j.data)}}else if(r.isDataArrayTexture)if(xe){if(Fe)t.texStorage3D(e.TEXTURE_2D_ARRAY,ae,le,z.width,z.height,z.depth);if(M)if(r.layerUpdates.size>0){const H=tn(z.width,z.height,r.format,r.type);for(const oe of r.layerUpdates){const he=z.data.subarray(oe*H/z.data.BYTES_PER_ELEMENT,(oe+1)*H/z.data.BYTES_PER_ELEMENT);t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,oe,z.width,z.height,1,ue,Ee,he)}r.clearLayerUpdates()}else t.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,z.width,z.height,z.depth,ue,Ee,z.data)}else t.texImage3D(e.TEXTURE_2D_ARRAY,0,le,z.width,z.height,z.depth,0,ue,Ee,z.data);else if(r.isData3DTexture)if(xe){if(Fe)t.texStorage3D(e.TEXTURE_3D,ae,le,z.width,z.height,z.depth);if(M)t.texSubImage3D(e.TEXTURE_3D,0,0,0,0,z.width,z.height,z.depth,ue,Ee,z.data)}else t.texImage3D(e.TEXTURE_3D,0,le,z.width,z.height,z.depth,0,ue,Ee,z.data);else if(r.isFramebufferTexture){if(Fe)if(xe)t.texStorage2D(e.TEXTURE_2D,ae,le,z.width,z.height);else{let H=z.width,oe=z.height;for(let he=0;he<ae;he++){t.texImage2D(e.TEXTURE_2D,he,le,H,oe,0,ue,Ee,null);H>>=1;oe>>=1}}}else if(r.isHTMLTexture){if("texElementImage2D"in e){const H=e.canvas;if(!H.hasAttribute("layoutsubtree"))H.setAttribute("layoutsubtree","true");if(z.parentNode!==H){H.appendChild(z);N.add(r);H.onpaint=(oe)=>{const he=oe.changedElements;for(const q of N)if(he.includes(q.image))q.needsUpdate=!0};H.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,z);else{const oe=0,{RGBA:he,RGBA:q,UNSIGNED_BYTE:ce}=e;e.texElementImage2D(e.TEXTURE_2D,oe,he,q,ce,z)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR);e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE);e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(Me.length>0){if(xe&&Fe){const H=Ye(Me[0]);t.texStorage2D(e.TEXTURE_2D,ae,le,H.width,H.height)}for(let H=0,oe=Me.length;H<oe;H++){j=Me[H];if(xe){if(M)t.texSubImage2D(e.TEXTURE_2D,H,0,0,ue,Ee,j)}else t.texImage2D(e.TEXTURE_2D,H,le,ue,Ee,j)}r.generateMipmaps=!1}else if(xe){if(Fe){const H=Ye(z);t.texStorage2D(e.TEXTURE_2D,ae,le,H.width,H.height)}if(M)t.texSubImage2D(e.TEXTURE_2D,0,0,0,ue,Ee,z)}else t.texImage2D(e.TEXTURE_2D,0,le,ue,Ee,z);if(o(r))U(w);se.__version=ne.version;if(r.onUpdate)r.onUpdate(r)}s.__version=r.version}function be(s,r,v){if(r.image.length!==6)return;const w=V(s,r),K=r.source;t.bindTexture(e.TEXTURE_CUBE_MAP,s.__webglTexture,e.TEXTURE0+v);const ne=i.get(K);if(K.version!==ne.__version||w===!0){t.activeTexture(e.TEXTURE0+v);const se=ColorManagement.getPrimaries(ColorManagement.workingColorSpace),B=r.colorSpace===NoColorSpace?null:ColorManagement.getPrimaries(r.colorSpace),z=r.colorSpace===NoColorSpace||se===B?e.NONE:e.BROWSER_DEFAULT_WEBGL;t.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,r.flipY);t.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,r.premultiplyAlpha);t.pixelStorei(e.UNPACK_ALIGNMENT,r.unpackAlignment);t.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,z);const ue=r.isCompressedTexture||r.image[0].isCompressedTexture,Ee=r.image[0]&&r.image[0].isDataTexture,le=[];for(let q=0;q<6;q++){if(!ue&&!Ee)le[q]=d(r.image[q],!0,f.maxCubemapSize);else le[q]=Ee?r.image[q].image:r.image[q];le[q]=Oe(r,le[q])}const j=le[0],Me=l.convert(r.format,r.colorSpace),xe=l.convert(r.type),Fe=m(r.internalFormat,Me,xe,r.normalized,r.colorSpace),M=r.isVideoTexture!==!0,ae=ne.__version===void 0||w===!0,H=K.dataReady;let oe=A(r,j);we(e.TEXTURE_CUBE_MAP,r);let he;if(ue){if(M&&ae)t.texStorage2D(e.TEXTURE_CUBE_MAP,oe,Fe,j.width,j.height);for(let q=0;q<6;q++){he=le[q].mipmaps;for(let ce=0;ce<he.length;ce++){const Ce=he[ce];if(r.format!==RGBAFormat)if(Me!==null)if(M){if(H)t.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,ce,0,0,Ce.width,Ce.height,Me,Ce.data)}else t.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,ce,Fe,Ce.width,Ce.height,0,Ce.data);else warn("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()");else if(M){if(H)t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,ce,0,0,Ce.width,Ce.height,Me,xe,Ce.data)}else t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,ce,Fe,Ce.width,Ce.height,0,Me,xe,Ce.data)}}}else{he=r.mipmaps;if(M&&ae){if(he.length>0)oe++;const q=Ye(le[0]);t.texStorage2D(e.TEXTURE_CUBE_MAP,oe,Fe,q.width,q.height)}for(let q=0;q<6;q++)if(Ee){if(M){if(H)t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,0,0,le[q].width,le[q].height,Me,xe,le[q].data)}else t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,Fe,le[q].width,le[q].height,0,Me,xe,le[q].data);for(let ce=0;ce<he.length;ce++){const ke=he[ce].image[q].image;if(M){if(H)t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,ce+1,0,0,ke.width,ke.height,Me,xe,ke.data)}else t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,ce+1,Fe,ke.width,ke.height,0,Me,xe,ke.data)}}else{if(M){if(H)t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,0,0,Me,xe,le[q])}else t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,Fe,Me,xe,le[q]);for(let ce=0;ce<he.length;ce++){const Ce=he[ce];if(M){if(H)t.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,ce+1,0,0,Me,xe,Ce.image[q])}else t.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+q,ce+1,Fe,Me,xe,Ce.image[q])}}}if(o(r))U(e.TEXTURE_CUBE_MAP);ne.__version=K.version;if(r.onUpdate)r.onUpdate(r)}s.__version=r.version}function Te(s,r,v,w,K,ne){const se=l.convert(v.format,v.colorSpace),B=l.convert(v.type),z=m(v.internalFormat,se,B,v.normalized,v.colorSpace),ue=i.get(r),Ee=i.get(v);Ee.__renderTarget=r;if(!ue.__hasExternalTextures){const le=Math.max(1,r.width>>ne),j=Math.max(1,r.height>>ne);if(K===e.TEXTURE_3D||K===e.TEXTURE_2D_ARRAY)t.texImage3D(K,ne,z,le,j,r.depth,0,se,B,null);else t.texImage2D(K,ne,z,le,j,0,se,B,null)}t.bindFramebuffer(e.FRAMEBUFFER,s);if(E(r))_.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,w,K,Ee.__webglTexture,0,je(r));else if(K===e.TEXTURE_2D||K>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)e.framebufferTexture2D(e.FRAMEBUFFER,w,K,Ee.__webglTexture,ne);t.bindFramebuffer(e.FRAMEBUFFER,null)}function Qe(s,r,v){e.bindRenderbuffer(e.RENDERBUFFER,s);if(r.depthBuffer){const w=r.depthTexture,K=w&&w.isDepthTexture?w.type:null,ne=g(r.stencilBuffer,K),se=r.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(E(r))_.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,je(r),ne,r.width,r.height);else if(v)e.renderbufferStorageMultisample(e.RENDERBUFFER,je(r),ne,r.width,r.height);else e.renderbufferStorage(e.RENDERBUFFER,ne,r.width,r.height);e.framebufferRenderbuffer(e.FRAMEBUFFER,se,e.RENDERBUFFER,s)}else{const w=r.textures;for(let K=0;K<w.length;K++){const ne=w[K],se=l.convert(ne.format,ne.colorSpace),B=l.convert(ne.type),z=m(ne.internalFormat,se,B,ne.normalized,ne.colorSpace);if(E(r))_.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,je(r),z,r.width,r.height);else if(v)e.renderbufferStorageMultisample(e.RENDERBUFFER,je(r),z,r.width,r.height);else e.renderbufferStorage(e.RENDERBUFFER,z,r.width,r.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function De(s,r,v){const w=r.isWebGLCubeRenderTarget===!0;t.bindFramebuffer(e.FRAMEBUFFER,s);if(!(r.depthTexture&&r.depthTexture.isDepthTexture))throw Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const K=i.get(r.depthTexture);K.__renderTarget=r;if(!K.__webglTexture||r.depthTexture.image.width!==r.width||r.depthTexture.image.height!==r.height){r.depthTexture.image.width=r.width;r.depthTexture.image.height=r.height;r.depthTexture.needsUpdate=!0}if(w){if(K.__webglInit===void 0){K.__webglInit=!0;r.depthTexture.addEventListener("dispose",L)}if(K.__webglTexture===void 0){K.__webglTexture=e.createTexture();t.bindTexture(e.TEXTURE_CUBE_MAP,K.__webglTexture);we(e.TEXTURE_CUBE_MAP,r.depthTexture);const ue=l.convert(r.depthTexture.format),Ee=l.convert(r.depthTexture.type);let le;if(r.depthTexture.format===DepthFormat)le=e.DEPTH_COMPONENT24;else if(r.depthTexture.format===DepthStencilFormat)le=e.DEPTH24_STENCIL8;for(let j=0;j<6;j++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+j,0,le,r.width,r.height,0,ue,Ee,null)}}else pe(r.depthTexture,0);const ne=K.__webglTexture,se=je(r),B=w?e.TEXTURE_CUBE_MAP_POSITIVE_X+v:e.TEXTURE_2D,z=r.depthTexture.format===DepthStencilFormat?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(r.depthTexture.format===DepthFormat)if(E(r))_.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,z,B,ne,0,se);else e.framebufferTexture2D(e.FRAMEBUFFER,z,B,ne,0);else if(r.depthTexture.format===DepthStencilFormat)if(E(r))_.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,z,B,ne,0,se);else e.framebufferTexture2D(e.FRAMEBUFFER,z,B,ne,0);else throw Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Ie(s){const r=i.get(s),v=s.isWebGLCubeRenderTarget===!0;if(r.__boundDepthTexture!==s.depthTexture){const w=s.depthTexture;if(r.__depthDisposeCallback)r.__depthDisposeCallback();if(w){const K=()=>{delete r.__boundDepthTexture;delete r.__depthDisposeCallback;w.removeEventListener("dispose",K)};w.addEventListener("dispose",K);r.__depthDisposeCallback=K}r.__boundDepthTexture=w}if(s.depthTexture&&!r.__autoAllocateDepthBuffer)if(v)for(let w=0;w<6;w++)De(r.__webglFramebuffer[w],s,w);else{const w=s.texture.mipmaps;if(w&&w.length>0)De(r.__webglFramebuffer[0],s,0);else De(r.__webglFramebuffer,s,0)}else if(v){r.__webglDepthbuffer=[];for(let w=0;w<6;w++){t.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer[w]);if(r.__webglDepthbuffer[w]===void 0){r.__webglDepthbuffer[w]=e.createRenderbuffer();Qe(r.__webglDepthbuffer[w],s,!1)}else{const K=s.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ne=r.__webglDepthbuffer[w];e.bindRenderbuffer(e.RENDERBUFFER,ne);e.framebufferRenderbuffer(e.FRAMEBUFFER,K,e.RENDERBUFFER,ne)}}}else{const w=s.texture.mipmaps;if(w&&w.length>0)t.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer[0]);else t.bindFramebuffer(e.FRAMEBUFFER,r.__webglFramebuffer);if(r.__webglDepthbuffer===void 0){r.__webglDepthbuffer=e.createRenderbuffer();Qe(r.__webglDepthbuffer,s,!1)}else{const K=s.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ne=r.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,ne);e.framebufferRenderbuffer(e.FRAMEBUFFER,K,e.RENDERBUFFER,ne)}}t.bindFramebuffer(e.FRAMEBUFFER,null)}function He(s,r,v){const w=i.get(s);if(r!==void 0)Te(w.__webglFramebuffer,s,s.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0);if(v!==void 0)Ie(s)}function Ne(s){const r=s.texture,v=i.get(s),w=i.get(r);s.addEventListener("dispose",c);const K=s.textures,ne=s.isWebGLCubeRenderTarget===!0,se=K.length>1;if(!se){if(w.__webglTexture===void 0)w.__webglTexture=e.createTexture();w.__version=r.version;u.memory.textures++}if(ne){v.__webglFramebuffer=[];for(let B=0;B<6;B++)if(r.mipmaps&&r.mipmaps.length>0){v.__webglFramebuffer[B]=[];for(let z=0;z<r.mipmaps.length;z++)v.__webglFramebuffer[B][z]=e.createFramebuffer()}else v.__webglFramebuffer[B]=e.createFramebuffer()}else{if(r.mipmaps&&r.mipmaps.length>0){v.__webglFramebuffer=[];for(let B=0;B<r.mipmaps.length;B++)v.__webglFramebuffer[B]=e.createFramebuffer()}else v.__webglFramebuffer=e.createFramebuffer();if(se)for(let B=0,z=K.length;B<z;B++){const ue=i.get(K[B]);if(ue.__webglTexture===void 0){ue.__webglTexture=e.createTexture();u.memory.textures++}}if(s.samples>0&&E(s)===!1){v.__webglMultisampledFramebuffer=e.createFramebuffer();v.__webglColorRenderbuffer=[];t.bindFramebuffer(e.FRAMEBUFFER,v.__webglMultisampledFramebuffer);for(let B=0;B<K.length;B++){const z=K[B];v.__webglColorRenderbuffer[B]=e.createRenderbuffer();e.bindRenderbuffer(e.RENDERBUFFER,v.__webglColorRenderbuffer[B]);const ue=l.convert(z.format,z.colorSpace),Ee=l.convert(z.type),le=m(z.internalFormat,ue,Ee,z.normalized,z.colorSpace,s.isXRRenderTarget===!0),j=je(s);e.renderbufferStorageMultisample(e.RENDERBUFFER,j,le,s.width,s.height);e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+B,e.RENDERBUFFER,v.__webglColorRenderbuffer[B])}e.bindRenderbuffer(e.RENDERBUFFER,null);if(s.depthBuffer){v.__webglDepthRenderbuffer=e.createRenderbuffer();Qe(v.__webglDepthRenderbuffer,s,!0)}t.bindFramebuffer(e.FRAMEBUFFER,null)}}if(ne){t.bindTexture(e.TEXTURE_CUBE_MAP,w.__webglTexture);we(e.TEXTURE_CUBE_MAP,r);for(let B=0;B<6;B++)if(r.mipmaps&&r.mipmaps.length>0)for(let z=0;z<r.mipmaps.length;z++)Te(v.__webglFramebuffer[B][z],s,r,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+B,z);else Te(v.__webglFramebuffer[B],s,r,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+B,0);if(o(r))U(e.TEXTURE_CUBE_MAP);t.unbindTexture()}else if(se){for(let B=0,z=K.length;B<z;B++){const ue=K[B],Ee=i.get(ue);let le=e.TEXTURE_2D;if(s.isWebGL3DRenderTarget||s.isWebGLArrayRenderTarget)le=s.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY;t.bindTexture(le,Ee.__webglTexture);we(le,ue);Te(v.__webglFramebuffer,s,ue,e.COLOR_ATTACHMENT0+B,le,0);if(o(ue))U(le)}t.unbindTexture()}else{let B=e.TEXTURE_2D;if(s.isWebGL3DRenderTarget||s.isWebGLArrayRenderTarget)B=s.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY;t.bindTexture(B,w.__webglTexture);we(B,r);if(r.mipmaps&&r.mipmaps.length>0)for(let z=0;z<r.mipmaps.length;z++)Te(v.__webglFramebuffer[z],s,r,e.COLOR_ATTACHMENT0,B,z);else Te(v.__webglFramebuffer,s,r,e.COLOR_ATTACHMENT0,B,0);if(o(r))U(B);t.unbindTexture()}if(s.depthBuffer)Ie(s)}function nt(s){const r=s.textures;for(let v=0,w=r.length;v<w;v++){const K=r[v];if(o(K)){const ne=X(s),se=i.get(K).__webglTexture;t.bindTexture(ne,se);U(ne);t.unbindTexture()}}}const Xe=[],at=[];function Je(s){if(s.samples>0){if(E(s)===!1){const{textures:r,width:v,height:w}=s;let K=e.COLOR_BUFFER_BIT;const ne=s.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,se=i.get(s),B=r.length>1;if(B)for(let ue=0;ue<r.length;ue++){t.bindFramebuffer(e.FRAMEBUFFER,se.__webglMultisampledFramebuffer);e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ue,e.RENDERBUFFER,null);t.bindFramebuffer(e.FRAMEBUFFER,se.__webglFramebuffer);e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ue,e.TEXTURE_2D,null,0)}t.bindFramebuffer(e.READ_FRAMEBUFFER,se.__webglMultisampledFramebuffer);const z=s.texture.mipmaps;if(z&&z.length>0)t.bindFramebuffer(e.DRAW_FRAMEBUFFER,se.__webglFramebuffer[0]);else t.bindFramebuffer(e.DRAW_FRAMEBUFFER,se.__webglFramebuffer);for(let ue=0;ue<r.length;ue++){if(s.resolveDepthBuffer){if(s.depthBuffer)K|=e.DEPTH_BUFFER_BIT;if(s.stencilBuffer&&s.resolveStencilBuffer)K|=e.STENCIL_BUFFER_BIT}if(B){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,se.__webglColorRenderbuffer[ue]);const Ee=i.get(r[ue]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,Ee,0)}e.blitFramebuffer(0,0,v,w,0,0,v,w,K,e.NEAREST);if(F===!0){Xe.length=0;at.length=0;Xe.push(e.COLOR_ATTACHMENT0+ue);if(s.depthBuffer&&s.storeMultisampledDepthBuffer===!1){Xe.push(ne);at.push(ne);e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,at)}e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Xe)}}t.bindFramebuffer(e.READ_FRAMEBUFFER,null);t.bindFramebuffer(e.DRAW_FRAMEBUFFER,null);if(B)for(let ue=0;ue<r.length;ue++){t.bindFramebuffer(e.FRAMEBUFFER,se.__webglMultisampledFramebuffer);e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ue,e.RENDERBUFFER,se.__webglColorRenderbuffer[ue]);const Ee=i.get(r[ue]).__webglTexture;t.bindFramebuffer(e.FRAMEBUFFER,se.__webglFramebuffer);e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ue,e.TEXTURE_2D,Ee,0)}t.bindFramebuffer(e.DRAW_FRAMEBUFFER,se.__webglMultisampledFramebuffer)}else if(s.depthBuffer&&s.storeMultisampledDepthBuffer===!1&&F){const r=s.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[r])}}}function je(s){return Math.min(f.maxSamples,s.samples)}function E(s){const r=i.get(s);return s.samples>0&&n.has("WEBGL_multisampled_render_to_texture")===!0&&r.__useRenderToTexture!==!1}function ot(s){const r=u.render.frame;if(y.get(s)!==r){y.set(s,r);s.update()}}function Oe(s,r){const{colorSpace:v,format:w,type:K}=s;if(s.isCompressedTexture===!0||s.isVideoTexture===!0)return r;if(v!==LinearSRGBColorSpace&&v!==NoColorSpace)if(ColorManagement.getTransfer(v)===SRGBTransfer){if(w!==RGBAFormat||K!==UnsignedByteType)warn("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.")}else error("WebGLTextures: Unsupported texture color space:",v);return r}function Ye(s){if(typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement){x.width=s.naturalWidth||s.width;x.height=s.naturalHeight||s.height}else if(typeof VideoFrame<"u"&&s instanceof VideoFrame){x.width=s.displayWidth;x.height=s.displayHeight}else{x.width=s.width;x.height=s.height}return x}this.allocateTextureUnit=Q;this.resetTextureUnits=te;this.getTextureUnits=C;this.setTextureUnits=k;this.setTexture2D=pe;this.setTexture2DArray=Y;this.setTexture3D=J;this.setTextureCube=ee;this.rebindTextures=He;this.setupRenderTarget=Ne;this.updateRenderTargetMipmap=nt;this.updateMultisampleRenderTarget=Je;this.setupDepthRenderbuffer=Ie;this.setupFrameBufferTexture=Te;this.useMultisampledRTT=E;this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function WebGLUtils(e,n){function t(i,f=NoColorSpace){let l;const u=ColorManagement.getTransfer(f);if(i===UnsignedByteType)return e.UNSIGNED_BYTE;if(i===UnsignedShort4444Type)return e.UNSIGNED_SHORT_4_4_4_4;if(i===UnsignedShort5551Type)return e.UNSIGNED_SHORT_5_5_5_1;if(i===UnsignedInt5999Type)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===UnsignedInt101111Type)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===ByteType)return e.BYTE;if(i===ShortType)return e.SHORT;if(i===UnsignedShortType)return e.UNSIGNED_SHORT;if(i===IntType)return e.INT;if(i===UnsignedIntType)return e.UNSIGNED_INT;if(i===FloatType)return e.FLOAT;if(i===HalfFloatType)return e.HALF_FLOAT;if(i===AlphaFormat)return e.ALPHA;if(i===RGBFormat)return e.RGB;if(i===RGBAFormat)return e.RGBA;if(i===DepthFormat)return e.DEPTH_COMPONENT;if(i===DepthStencilFormat)return e.DEPTH_STENCIL;if(i===RedFormat)return e.RED;if(i===RedIntegerFormat)return e.RED_INTEGER;if(i===RGFormat)return e.RG;if(i===RGIntegerFormat)return e.RG_INTEGER;if(i===RGBAIntegerFormat)return e.RGBA_INTEGER;if(i===RGB_S3TC_DXT1_Format||i===RGBA_S3TC_DXT1_Format||i===RGBA_S3TC_DXT3_Format||i===RGBA_S3TC_DXT5_Format)if(u===SRGBTransfer){l=n.get("WEBGL_compressed_texture_s3tc_srgb");if(l!==null){if(i===RGB_S3TC_DXT1_Format)return l.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===RGBA_S3TC_DXT1_Format)return l.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===RGBA_S3TC_DXT3_Format)return l.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===RGBA_S3TC_DXT5_Format)return l.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else{l=n.get("WEBGL_compressed_texture_s3tc");if(l!==null){if(i===RGB_S3TC_DXT1_Format)return l.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===RGBA_S3TC_DXT1_Format)return l.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===RGBA_S3TC_DXT3_Format)return l.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===RGBA_S3TC_DXT5_Format)return l.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(i===RGB_PVRTC_4BPPV1_Format||i===RGB_PVRTC_2BPPV1_Format||i===RGBA_PVRTC_4BPPV1_Format||i===RGBA_PVRTC_2BPPV1_Format){l=n.get("WEBGL_compressed_texture_pvrtc");if(l!==null){if(i===RGB_PVRTC_4BPPV1_Format)return l.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===RGB_PVRTC_2BPPV1_Format)return l.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===RGBA_PVRTC_4BPPV1_Format)return l.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===RGBA_PVRTC_2BPPV1_Format)return l.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(i===RGB_ETC1_Format||i===RGB_ETC2_Format||i===RGBA_ETC2_EAC_Format||i===R11_EAC_Format||i===SIGNED_R11_EAC_Format||i===RG11_EAC_Format||i===SIGNED_RG11_EAC_Format){l=n.get("WEBGL_compressed_texture_etc");if(l!==null){if(i===RGB_ETC1_Format||i===RGB_ETC2_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ETC2:l.COMPRESSED_RGB8_ETC2;if(i===RGBA_ETC2_EAC_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:l.COMPRESSED_RGBA8_ETC2_EAC;if(i===R11_EAC_Format)return l.COMPRESSED_R11_EAC;if(i===SIGNED_R11_EAC_Format)return l.COMPRESSED_SIGNED_R11_EAC;if(i===RG11_EAC_Format)return l.COMPRESSED_RG11_EAC;if(i===SIGNED_RG11_EAC_Format)return l.COMPRESSED_SIGNED_RG11_EAC}else return null}if(i===RGBA_ASTC_4x4_Format||i===RGBA_ASTC_5x4_Format||i===RGBA_ASTC_5x5_Format||i===RGBA_ASTC_6x5_Format||i===RGBA_ASTC_6x6_Format||i===RGBA_ASTC_8x5_Format||i===RGBA_ASTC_8x6_Format||i===RGBA_ASTC_8x8_Format||i===RGBA_ASTC_10x5_Format||i===RGBA_ASTC_10x6_Format||i===RGBA_ASTC_10x8_Format||i===RGBA_ASTC_10x10_Format||i===RGBA_ASTC_12x10_Format||i===RGBA_ASTC_12x12_Format){l=n.get("WEBGL_compressed_texture_astc");if(l!==null){if(i===RGBA_ASTC_4x4_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:l.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===RGBA_ASTC_5x4_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:l.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===RGBA_ASTC_5x5_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:l.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===RGBA_ASTC_6x5_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:l.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===RGBA_ASTC_6x6_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:l.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===RGBA_ASTC_8x5_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:l.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===RGBA_ASTC_8x6_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:l.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===RGBA_ASTC_8x8_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:l.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===RGBA_ASTC_10x5_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:l.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===RGBA_ASTC_10x6_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:l.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===RGBA_ASTC_10x8_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:l.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===RGBA_ASTC_10x10_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:l.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===RGBA_ASTC_12x10_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:l.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===RGBA_ASTC_12x12_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:l.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(i===RGBA_BPTC_Format||i===RGB_BPTC_SIGNED_Format||i===RGB_BPTC_UNSIGNED_Format){l=n.get("EXT_texture_compression_bptc");if(l!==null){if(i===RGBA_BPTC_Format)return u===SRGBTransfer?l.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:l.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===RGB_BPTC_SIGNED_Format)return l.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===RGB_BPTC_UNSIGNED_Format)return l.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(i===RED_RGTC1_Format||i===SIGNED_RED_RGTC1_Format||i===RED_GREEN_RGTC2_Format||i===SIGNED_RED_GREEN_RGTC2_Format){l=n.get("EXT_texture_compression_rgtc");if(l!==null){if(i===RED_RGTC1_Format)return l.COMPRESSED_RED_RGTC1_EXT;if(i===SIGNED_RED_RGTC1_Format)return l.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===RED_GREEN_RGTC2_Format)return l.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===SIGNED_RED_GREEN_RGTC2_Format)return l.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}if(i===UnsignedInt248Type)return e.UNSIGNED_INT_24_8;return e[i]!==void 0?e[i]:null}return{convert:t}}const Us=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Ds=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Fn{constructor(){this.texture=null;this.mesh=null;this.depthNear=0;this.depthFar=0}init(e,n){if(this.texture===null){const t=new ExternalTexture(e.texture);if(e.depthNear!==n.depthNear||e.depthFar!==n.depthFar){this.depthNear=e.depthNear;this.depthFar=e.depthFar}this.texture=t}}getMesh(e){if(this.texture!==null){if(this.mesh===null){const n=e.cameras[0].viewport,t=new ShaderMaterial({vertexShader:Us,fragmentShader:Ds,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new Mesh(new PlaneGeometry(20,20),t)}}return this.mesh}reset(){this.texture=null;this.mesh=null}getDepthTexture(){return this.texture}}class On extends EventDispatcher{constructor(e,n){super();const t=this;let i=null,f=1,l=null,u="local-floor",_=1,F=null,x=null,y=null,N=null,h=null,T=null;const P=typeof XRWebGLBinding<"u",W=new Fn,d={},o=n.getContextAttributes();let U=null,X=null;const m=[],g=[],A=new Vector2;let L=null,c=null;const p=new PerspectiveCamera;p.viewport=new Vector4;const Z=new PerspectiveCamera;Z.viewport=new Vector4;const D=[p,Z],O=new ArrayCamera;let te=null,C=null;this.cameraAutoUpdate=!0;this.enabled=!1;this.isPresenting=!1;this.getController=function(V){let ie=m[V];if(ie===void 0){ie=new WebXRController;m[V]=ie}return ie.getTargetRaySpace()};this.getControllerGrip=function(V){let ie=m[V];if(ie===void 0){ie=new WebXRController;m[V]=ie}return ie.getGripSpace()};this.getHand=function(V){let ie=m[V];if(ie===void 0){ie=new WebXRController;m[V]=ie}return ie.getHandSpace()};function k(V){const ie=g.indexOf(V.inputSource);if(ie===-1)return;const re=m[ie];if(re!==void 0){re.update(V.inputSource,V.frame,F||l);re.dispatchEvent({type:V.type,data:V.inputSource})}}function Q(){i.removeEventListener("select",k);i.removeEventListener("selectstart",k);i.removeEventListener("selectend",k);i.removeEventListener("squeeze",k);i.removeEventListener("squeezestart",k);i.removeEventListener("squeezeend",k);i.removeEventListener("end",Q);i.removeEventListener("inputsourceschange",G);for(let V=0;V<m.length;V++){const ie=g[V];if(ie===null)continue;g[V]=null;m[V].disconnect(ie)}te=null;C=null;W.reset();for(const V in d)delete d[V];e.setRenderTarget(U);h=null;N=null;y=null;i=null;X=null;we.stop();t.isPresenting=!1;e.setPixelRatio(L);e.setSize(A.width,A.height,!1);if(c!==null){const V=c.camera;V.fov=c.fov;V.zoom=c.zoom;V.updateProjectionMatrix();c=null}t.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(V){f=V;if(t.isPresenting===!0)warn("WebXRManager: Cannot change framebuffer scale while presenting.")};this.setReferenceSpaceType=function(V){u=V;if(t.isPresenting===!0)warn("WebXRManager: Cannot change reference space type while presenting.")};this.getReferenceSpace=function(){return F||l};this.setReferenceSpace=function(V){F=V};this.getBaseLayer=function(){return N!==null?N:h};this.getBinding=function(){if(y===null&&P)y=new XRWebGLBinding(i,n);return y};this.getFrame=function(){return T};this.getSession=function(){return i};this.setSession=async function(V){i=V;if(i!==null){U=e.getRenderTarget();i.addEventListener("select",k);i.addEventListener("selectstart",k);i.addEventListener("selectend",k);i.addEventListener("squeeze",k);i.addEventListener("squeezestart",k);i.addEventListener("squeezeend",k);i.addEventListener("end",Q);i.addEventListener("inputsourceschange",G);if(o.xrCompatible!==!0)await n.makeXRCompatible();L=e.getPixelRatio();e.getSize(A);if(!(P&&("createProjectionLayer"in XRWebGLBinding.prototype))){const re={antialias:o.antialias,alpha:!0,depth:o.depth,stencil:o.stencil,framebufferScaleFactor:f};h=new XRWebGLLayer(i,n,re);i.updateRenderState({baseLayer:h});e.setPixelRatio(1);e.setSize(h.framebufferWidth,h.framebufferHeight,!1);X=new WebGLRenderTarget(h.framebufferWidth,h.framebufferHeight,{format:RGBAFormat,type:UnsignedByteType,colorSpace:e.outputColorSpace,stencilBuffer:o.stencil,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{let re=null,Re=null,be=null;if(o.depth){be=o.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24;re=o.stencil?DepthStencilFormat:DepthFormat;Re=o.stencil?UnsignedInt248Type:UnsignedIntType}const Te={colorFormat:n.RGBA8,depthFormat:be,scaleFactor:f};y=this.getBinding();N=y.createProjectionLayer(Te);i.updateRenderState({layers:[N]});e.setPixelRatio(1);e.setSize(N.textureWidth,N.textureHeight,!1);X=new WebGLRenderTarget(N.textureWidth,N.textureHeight,{format:RGBAFormat,type:UnsignedByteType,depthTexture:new DepthTexture(N.textureWidth,N.textureHeight,Re,void 0,void 0,void 0,void 0,void 0,void 0,re),stencilBuffer:o.stencil,colorSpace:e.outputColorSpace,samples:o.antialias?4:0,resolveDepthBuffer:N.ignoreDepthValues===!1,resolveStencilBuffer:N.ignoreDepthValues===!1,storeMultisampledDepthBuffer:N.ignoreDepthValues===!1,storeMultisampledStencilBuffer:N.ignoreDepthValues===!1})}X.isXRRenderTarget=!0;this.setFoveation(_);F=null;l=await i.requestReferenceSpace(u);we.setContext(i);we.start();t.isPresenting=!0;t.dispatchEvent({type:"sessionstart"})}};this.getEnvironmentBlendMode=function(){if(i!==null)return i.environmentBlendMode};this.getDepthTexture=function(){return W.getDepthTexture()};function G(V){for(let ie=0;ie<V.removed.length;ie++){const re=V.removed[ie],Re=g.indexOf(re);if(Re>=0){g[Re]=null;m[Re].disconnect(re)}}for(let ie=0;ie<V.added.length;ie++){const re=V.added[ie];let Re=g.indexOf(re);if(Re===-1){for(let Te=0;Te<m.length;Te++)if(Te>=g.length){g.push(re);Re=Te;break}else if(g[Te]===null){g[Te]=re;Re=Te;break}if(Re===-1)break}const be=m[Re];if(be)be.connect(re)}}const pe=new Vector3,Y=new Vector3;function J(V,ie,re){pe.setFromMatrixPosition(ie.matrixWorld);Y.setFromMatrixPosition(re.matrixWorld);const Re=pe.distanceTo(Y),be=ie.projectionMatrix.elements,Te=re.projectionMatrix.elements,Qe=be[14]/(be[10]-1),De=be[14]/(be[10]+1),Ie=(be[9]+1)/be[5],He=(be[9]-1)/be[5],Ne=(be[8]-1)/be[0],nt=(Te[8]+1)/Te[0],Xe=Qe*Ne,at=Qe*nt,Je=Re/(-Ne+nt),je=Je*-Ne;ie.matrixWorld.decompose(V.position,V.quaternion,V.scale);V.translateX(je);V.translateZ(Je);V.matrixWorld.compose(V.position,V.quaternion,V.scale);V.matrixWorldInverse.copy(V.matrixWorld).invert();if(be[10]===-1){V.projectionMatrix.copy(ie.projectionMatrix);V.projectionMatrixInverse.copy(ie.projectionMatrixInverse)}else{const E=Qe+Je,ot=De+Je,Oe=Xe-je,Ye=at+(Re-je),s=Ie*De/ot*E,r=He*De/ot*E;V.projectionMatrix.makePerspective(Oe,Ye,s,r,E,ot);V.projectionMatrixInverse.copy(V.projectionMatrix).invert()}}function ee(V,ie){if(ie===null)V.matrixWorld.copy(V.matrix);else V.matrixWorld.multiplyMatrices(ie.matrixWorld,V.matrix);V.matrixWorldInverse.copy(V.matrixWorld).invert()}this.updateCamera=function(V){if(i===null)return;let{near:ie,far:re}=V;if(W.texture!==null){if(W.depthNear>0)ie=W.depthNear;if(W.depthFar>0)re=W.depthFar}O.near=Z.near=p.near=ie;O.far=Z.far=p.far=re;if(te!==O.near||C!==O.far){i.updateRenderState({depthNear:O.near,depthFar:O.far});te=O.near;C=O.far}O.layers.mask=V.layers.mask|6;p.layers.mask=O.layers.mask&-5;Z.layers.mask=O.layers.mask&-3;const Re=V.parent,be=O.cameras;ee(O,Re);for(let Te=0;Te<be.length;Te++)ee(be[Te],Re);if(be.length===2)J(O,p,Z);else O.projectionMatrix.copy(p.projectionMatrix);if(c===null&&V.isPerspectiveCamera)c={camera:V,fov:V.fov,zoom:V.zoom};Pe(V,O,Re)};function Pe(V,ie,re){if(re===null)V.matrix.copy(ie.matrixWorld);else{V.matrix.copy(re.matrixWorld);V.matrix.invert();V.matrix.multiply(ie.matrixWorld)}V.matrix.decompose(V.position,V.quaternion,V.scale);V.updateMatrixWorld(!0);V.projectionMatrix.copy(ie.projectionMatrix);V.projectionMatrixInverse.copy(ie.projectionMatrixInverse);if(V.isPerspectiveCamera){V.fov=Kn*2*Math.atan(1/V.projectionMatrix.elements[5]);V.zoom=1}}this.getCamera=function(){return O};this.getFoveation=function(){if(N===null&&h===null)return;return _};this.setFoveation=function(V){_=V;if(N!==null)N.fixedFoveation=V;if(h!==null&&h.fixedFoveation!==void 0)h.fixedFoveation=V};this.hasDepthSensing=function(){return W.texture!==null};this.getDepthSensingMesh=function(){return W.getMesh(O)};this.getCameraTexture=function(V){return d[V]};let Ae=null;function Ze(V,ie){x=ie.getViewerPose(F||l);T=ie;if(x!==null){const re=x.views;if(h!==null){e.setRenderTargetFramebuffer(X,h.framebuffer);e.setRenderTarget(X)}let Re=!1;if(re.length!==O.cameras.length){O.cameras.length=0;Re=!0}for(let De=0;De<re.length;De++){const Ie=re[De];let He=null;if(h!==null)He=h.getViewport(Ie);else{const nt=y.getViewSubImage(N,Ie);He=nt.viewport;if(De===0){e.setRenderTargetTextures(X,nt.colorTexture,nt.depthStencilTexture);e.setRenderTarget(X)}}let Ne=D[De];if(Ne===void 0){Ne=new PerspectiveCamera;Ne.layers.enable(De);Ne.viewport=new Vector4;D[De]=Ne}Ne.matrix.fromArray(Ie.transform.matrix);Ne.matrix.decompose(Ne.position,Ne.quaternion,Ne.scale);Ne.projectionMatrix.fromArray(Ie.projectionMatrix);Ne.projectionMatrixInverse.copy(Ne.projectionMatrix).invert();Ne.viewport.set(He.x,He.y,He.width,He.height);if(De===0){O.matrix.copy(Ne.matrix);O.matrix.decompose(O.position,O.quaternion,O.scale)}if(Re===!0)O.cameras.push(Ne)}const be=i.enabledFeatures;if(be&&be.includes("depth-sensing")&&i.depthUsage=="gpu-optimized"&&P){y=t.getBinding();const De=y.getDepthInformation(re[0]);if(De&&De.isValid&&De.texture)W.init(De,i.renderState)}if(be&&be.includes("camera-access")&&P){e.state.unbindTexture();y=t.getBinding();for(let De=0;De<re.length;De++){const Ie=re[De].camera;if(Ie){let He=d[Ie];if(!He){He=new ExternalTexture;d[Ie]=He}const Ne=y.getCameraImage(Ie);He.sourceTexture=Ne}}}}for(let re=0;re<m.length;re++){const Re=g[re],be=m[re];if(Re!==null&&be!==void 0)be.update(Re,ie,F||l)}if(Ae)Ae(V,ie);if(ie.detectedPlanes)t.dispatchEvent({type:"planesdetected",data:ie});T=null}const we=new nn;we.setAnimationLoop(Ze);this.setAnimationLoop=function(V){Ae=V};this.dispose=function(){}}}const ws=new Matrix4,Un=new Matrix3;Un.set(-1,0,0,0,1,0,0,0,1);function Is(e,n){function t(d,o){if(d.matrixAutoUpdate===!0)d.updateMatrix();o.value.copy(d.matrix)}function i(d,o){o.color.getRGB(d.fogColor.value,en(e));if(o.isFog){d.fogNear.value=o.near;d.fogFar.value=o.far}else if(o.isFogExp2)d.fogDensity.value=o.density}function f(d,o,U,X,m){if(o.isNodeMaterial)o.uniformsNeedUpdate=!1;else if(o.isMeshBasicMaterial)l(d,o);else if(o.isMeshLambertMaterial){l(d,o);if(o.envMap)d.envMapIntensity.value=o.envMapIntensity}else if(o.isMeshToonMaterial){l(d,o);N(d,o)}else if(o.isMeshPhongMaterial){l(d,o);y(d,o);if(o.envMap)d.envMapIntensity.value=o.envMapIntensity}else if(o.isMeshStandardMaterial){l(d,o);h(d,o);if(o.isMeshPhysicalMaterial)T(d,o,m)}else if(o.isMeshMatcapMaterial){l(d,o);P(d,o)}else if(o.isMeshDepthMaterial)l(d,o);else if(o.isMeshDistanceMaterial){l(d,o);W(d,o)}else if(o.isMeshNormalMaterial)l(d,o);else if(o.isLineBasicMaterial){u(d,o);if(o.isLineDashedMaterial)_(d,o)}else if(o.isPointsMaterial)F(d,o,U,X);else if(o.isSpriteMaterial)x(d,o);else if(o.isShadowMaterial){d.color.value.copy(o.color);d.opacity.value=o.opacity}else if(o.isShaderMaterial)o.uniformsNeedUpdate=!1}function l(d,o){d.opacity.value=o.opacity;if(o.color)d.diffuse.value.copy(o.color);if(o.emissive)d.emissive.value.copy(o.emissive).multiplyScalar(o.emissiveIntensity);if(o.map){d.map.value=o.map;t(o.map,d.mapTransform)}if(o.alphaMap){d.alphaMap.value=o.alphaMap;t(o.alphaMap,d.alphaMapTransform)}if(o.bumpMap){d.bumpMap.value=o.bumpMap;t(o.bumpMap,d.bumpMapTransform);d.bumpScale.value=o.bumpScale;if(o.side===BackSide)d.bumpScale.value*=-1}if(o.normalMap){d.normalMap.value=o.normalMap;t(o.normalMap,d.normalMapTransform);d.normalScale.value.copy(o.normalScale);if(o.side===BackSide)d.normalScale.value.negate()}if(o.displacementMap){d.displacementMap.value=o.displacementMap;t(o.displacementMap,d.displacementMapTransform);d.displacementScale.value=o.displacementScale;d.displacementBias.value=o.displacementBias}if(o.emissiveMap){d.emissiveMap.value=o.emissiveMap;t(o.emissiveMap,d.emissiveMapTransform)}if(o.specularMap){d.specularMap.value=o.specularMap;t(o.specularMap,d.specularMapTransform)}if(o.alphaTest>0)d.alphaTest.value=o.alphaTest;const U=n.get(o),{envMap:X,envMapRotation:m}=U;if(X){d.envMap.value=X;d.envMapRotation.value.setFromMatrix4(ws.makeRotationFromEuler(m)).transpose();if(X.isCubeTexture&&X.isRenderTargetTexture===!1)d.envMapRotation.value.premultiply(Un);d.reflectivity.value=o.reflectivity;d.ior.value=o.ior;d.refractionRatio.value=o.refractionRatio}if(o.lightMap){d.lightMap.value=o.lightMap;d.lightMapIntensity.value=o.lightMapIntensity;t(o.lightMap,d.lightMapTransform)}if(o.aoMap){d.aoMap.value=o.aoMap;d.aoMapIntensity.value=o.aoMapIntensity;t(o.aoMap,d.aoMapTransform)}}function u(d,o){d.diffuse.value.copy(o.color);d.opacity.value=o.opacity;if(o.map){d.map.value=o.map;t(o.map,d.mapTransform)}}function _(d,o){d.dashSize.value=o.dashSize;d.totalSize.value=o.dashSize+o.gapSize;d.scale.value=o.scale}function F(d,o,U,X){d.diffuse.value.copy(o.color);d.opacity.value=o.opacity;d.size.value=o.size*U;d.scale.value=X*0.5;if(o.map){d.map.value=o.map;t(o.map,d.uvTransform)}if(o.alphaMap){d.alphaMap.value=o.alphaMap;t(o.alphaMap,d.alphaMapTransform)}if(o.alphaTest>0)d.alphaTest.value=o.alphaTest}function x(d,o){d.diffuse.value.copy(o.color);d.opacity.value=o.opacity;d.rotation.value=o.rotation;if(o.map){d.map.value=o.map;t(o.map,d.mapTransform)}if(o.alphaMap){d.alphaMap.value=o.alphaMap;t(o.alphaMap,d.alphaMapTransform)}if(o.alphaTest>0)d.alphaTest.value=o.alphaTest}function y(d,o){d.specular.value.copy(o.specular);d.shininess.value=Math.max(o.shininess,0.0001)}function N(d,o){if(o.gradientMap)d.gradientMap.value=o.gradientMap}function h(d,o){d.metalness.value=o.metalness;if(o.metalnessMap){d.metalnessMap.value=o.metalnessMap;t(o.metalnessMap,d.metalnessMapTransform)}d.roughness.value=o.roughness;if(o.roughnessMap){d.roughnessMap.value=o.roughnessMap;t(o.roughnessMap,d.roughnessMapTransform)}if(o.envMap)d.envMapIntensity.value=o.envMapIntensity}function T(d,o,U){d.ior.value=o.ior;if(o.sheen>0){d.sheenColor.value.copy(o.sheenColor).multiplyScalar(o.sheen);d.sheenRoughness.value=o.sheenRoughness;if(o.sheenColorMap){d.sheenColorMap.value=o.sheenColorMap;t(o.sheenColorMap,d.sheenColorMapTransform)}if(o.sheenRoughnessMap){d.sheenRoughnessMap.value=o.sheenRoughnessMap;t(o.sheenRoughnessMap,d.sheenRoughnessMapTransform)}}if(o.clearcoat>0){d.clearcoat.value=o.clearcoat;d.clearcoatRoughness.value=o.clearcoatRoughness;if(o.clearcoatMap){d.clearcoatMap.value=o.clearcoatMap;t(o.clearcoatMap,d.clearcoatMapTransform)}if(o.clearcoatRoughnessMap){d.clearcoatRoughnessMap.value=o.clearcoatRoughnessMap;t(o.clearcoatRoughnessMap,d.clearcoatRoughnessMapTransform)}if(o.clearcoatNormalMap){d.clearcoatNormalMap.value=o.clearcoatNormalMap;t(o.clearcoatNormalMap,d.clearcoatNormalMapTransform);d.clearcoatNormalScale.value.copy(o.clearcoatNormalScale);if(o.side===BackSide)d.clearcoatNormalScale.value.negate()}}if(o.dispersion>0)d.dispersion.value=o.dispersion;if(o.retroreflectivity>0)d.retroreflectivity.value=o.retroreflectivity;if(o.iridescence>0){d.iridescence.value=o.iridescence;d.iridescenceIOR.value=o.iridescenceIOR;d.iridescenceThicknessMinimum.value=o.iridescenceThicknessRange[0];d.iridescenceThicknessMaximum.value=o.iridescenceThicknessRange[1];if(o.iridescenceMap){d.iridescenceMap.value=o.iridescenceMap;t(o.iridescenceMap,d.iridescenceMapTransform)}if(o.iridescenceThicknessMap){d.iridescenceThicknessMap.value=o.iridescenceThicknessMap;t(o.iridescenceThicknessMap,d.iridescenceThicknessMapTransform)}}if(o.transmission>0){d.transmission.value=o.transmission;d.transmissionSamplerMap.value=U.texture;d.transmissionSamplerSize.value.set(U.width,U.height);if(o.transmissionMap){d.transmissionMap.value=o.transmissionMap;t(o.transmissionMap,d.transmissionMapTransform)}d.thickness.value=o.thickness;if(o.thicknessMap){d.thicknessMap.value=o.thicknessMap;t(o.thicknessMap,d.thicknessMapTransform)}d.attenuationDistance.value=o.attenuationDistance;d.attenuationColor.value.copy(o.attenuationColor)}if(o.anisotropy>0){d.anisotropyVector.value.set(o.anisotropy*Math.cos(o.anisotropyRotation),o.anisotropy*Math.sin(o.anisotropyRotation));if(o.anisotropyMap){d.anisotropyMap.value=o.anisotropyMap;t(o.anisotropyMap,d.anisotropyMapTransform)}}d.specularIntensity.value=o.specularIntensity;d.specularColor.value.copy(o.specularColor);if(o.specularColorMap){d.specularColorMap.value=o.specularColorMap;t(o.specularColorMap,d.specularColorMapTransform)}if(o.specularIntensityMap){d.specularIntensityMap.value=o.specularIntensityMap;t(o.specularIntensityMap,d.specularIntensityMapTransform)}}function P(d,o){if(o.matcap)d.matcap.value=o.matcap}function W(d,o){const U=n.get(o).light;d.referencePosition.value.setFromMatrixPosition(U.matrixWorld);d.nearDistance.value=U.shadow.camera.near;d.farDistance.value=U.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:f}}function Ns(e,n,t,i){let f={},l={},u=[];const _=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function F(m,g){const A=g.program;i.uniformBlockBinding(m,A)}function x(m,g){let A=f[m.id];if(A===void 0){d(m);A=y(m);f[m.id]=A;m.addEventListener("dispose",U)}const L=g.program;i.updateUBOMapping(m,L);const c=n.render.frame;if(l[m.id]!==c){h(m);l[m.id]=c}}function y(m){const g=N();m.__bindingPointIndex=g;const A=e.createBuffer(),{__size:L,usage:c}=m;e.bindBuffer(e.UNIFORM_BUFFER,A);e.bufferData(e.UNIFORM_BUFFER,L,c);e.bindBuffer(e.UNIFORM_BUFFER,null);e.bindBufferBase(e.UNIFORM_BUFFER,g,A);return A}function N(){for(let m=0;m<_;m++)if(u.indexOf(m)===-1){u.push(m);return m}error("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached.");return 0}function h(m){const g=f[m.id],{uniforms:A,__cache:L}=m;e.bindBuffer(e.UNIFORM_BUFFER,g);for(let c=0,p=A.length;c<p;c++){const Z=A[c];if(Array.isArray(Z))for(let D=0,O=Z.length;D<O;D++)T(Z[D],c,D,L);else T(Z,c,0,L)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function T(m,g,A,L){if(W(m,g,A,L)===!0){const{__offset:c,value:p}=m;if(Array.isArray(p)){let Z=0;for(let D=0;D<p.length;D++){const O=p[D],te=o(O);P(O,m.__data,Z);if(typeof O!=="number"&&typeof O!=="boolean"&&!O.isMatrix3&&!ArrayBuffer.isView(O))Z+=te.storage/Float32Array.BYTES_PER_ELEMENT}}else P(p,m.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,c,m.__data)}}function P(m,g,A){if(typeof m==="number"||typeof m==="boolean")g[0]=m;else if(m.isMatrix3){g[0]=m.elements[0];g[1]=m.elements[1];g[2]=m.elements[2];g[3]=0;g[4]=m.elements[3];g[5]=m.elements[4];g[6]=m.elements[5];g[7]=0;g[8]=m.elements[6];g[9]=m.elements[7];g[10]=m.elements[8];g[11]=0}else if(ArrayBuffer.isView(m))g.set(new m.constructor(m.buffer,m.byteOffset,g.length));else m.toArray(g,A)}function W(m,g,A,L){const c=m.value,p=g+"_"+A;if(L[p]===void 0){if(typeof c==="number"||typeof c==="boolean")L[p]=c;else if(ArrayBuffer.isView(c))L[p]=c.slice();else L[p]=c.clone();return!0}else{const Z=L[p];if(typeof c==="number"||typeof c==="boolean"){if(Z!==c){L[p]=c;return!0}}else if(ArrayBuffer.isView(c))return!0;else if(Z.equals(c)===!1){Z.copy(c);return!0}}return!1}function d(m){const g=m.uniforms;let A=0;const L=16;for(let p=0,Z=g.length;p<Z;p++){const D=Array.isArray(g[p])?g[p]:[g[p]];for(let O=0,te=D.length;O<te;O++){const C=D[O],k=Array.isArray(C.value)?C.value:[C.value];for(let Q=0,G=k.length;Q<G;Q++){const pe=k[Q],Y=o(pe),J=A%L,ee=J%Y.boundary,Pe=J+ee;A+=ee;if(Pe!==0&&L-Pe<Y.storage)A+=L-Pe;C.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT);C.__offset=A;A+=Y.storage}}}const c=A%L;if(c>0)A+=L-c;m.__size=A;m.__cache={};return this}function o(m){const g={boundary:0,storage:0};if(typeof m==="number"||typeof m==="boolean"){g.boundary=4;g.storage=4}else if(m.isVector2){g.boundary=8;g.storage=8}else if(m.isVector3||m.isColor){g.boundary=16;g.storage=12}else if(m.isVector4){g.boundary=16;g.storage=16}else if(m.isMatrix3){g.boundary=48;g.storage=48}else if(m.isMatrix4){g.boundary=64;g.storage=64}else if(m.isTexture)warn("WebGLRenderer: Texture samplers can not be part of an uniforms group.");else if(ArrayBuffer.isView(m)){g.boundary=16;g.storage=m.byteLength}else warn("WebGLRenderer: Unsupported uniform value type.",m);return g}function U(m){const g=m.target;g.removeEventListener("dispose",U);const A=u.indexOf(g.__bindingPointIndex);u.splice(A,1);e.deleteBuffer(f[g.id]);delete f[g.id];delete l[g.id]}function X(){for(const m in f)e.deleteBuffer(f[m]);u=[];f={};l={}}return{bind:F,update:x,dispose:X}}const ys=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let dt=null;function Fs(){if(dt===null){dt=new DataTexture(ys,16,16,RGFormat,HalfFloatType);dt.name="DFG_LUT";dt.minFilter=LinearFilter;dt.magFilter=LinearFilter;dt.wrapS=ClampToEdgeWrapping;dt.wrapT=ClampToEdgeWrapping;dt.generateMipmaps=!1;dt.needsUpdate=!0}return dt}class WebGLRenderer{constructor(e={}){const{canvas:n=createCanvasElement(),context:t=null,depth:i=!0,stencil:f=!1,alpha:l=!1,antialias:u=!1,premultipliedAlpha:_=!0,preserveDrawingBuffer:F=!1,powerPreference:x="default",failIfMajorPerformanceCaveat:y=!1,reversedDepthBuffer:N=!1,outputBufferType:h=UnsignedByteType}=e;this.isWebGLRenderer=!0;let T;if(t!==null){if(typeof WebGLRenderingContext<"u"&&t instanceof WebGLRenderingContext)throw Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");T=t.getContextAttributes().alpha}else T=l;const P=h,W=new Set([RGBAIntegerFormat,RGIntegerFormat,RedIntegerFormat]),d=new Set([UnsignedByteType,UnsignedIntType,UnsignedShortType,UnsignedInt248Type,UnsignedShort4444Type,UnsignedShort5551Type]),o=new Uint32Array(4),U=new Int32Array(4),X=new Vector3;let m=null,g=null;const A=[],L=[];let c=null;this.domElement=n;this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null};this.autoClear=!0;this.autoClearColor=!0;this.autoClearDepth=!0;this.autoClearStencil=!0;this.sortObjects=!0;this.clippingPlanes=[];this.localClippingEnabled=!1;this.toneMapping=NoToneMapping;this.toneMappingExposure=1;this.transmissionResolutionScale=1;const p=this;let Z=!1,D=null,O=null,te=null,C=null;this._outputColorSpace=SRGBColorSpace;let k=0,Q=0,G=null,pe=-1,Y=null;const J=new Vector4,ee=new Vector4;let Pe=null;const Ae=new Color(0);let Ze=0,{width:we,height:V}=n,ie=1,re=null,Re=null;const be=new Vector4(0,0,we,V),Te=new Vector4(0,0,we,V);let Qe=!1;const De=new Frustum;let Ie=!1,He=!1;const Ne=new Matrix4,nt=new Vector3,Xe=new Vector4,at={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Je=!1;function je(){return G===null?ie:1}let E=t;function ot(a,S){return n.getContext(a,S)}let Oe,Ye,s,r,v,w,K,ne,se,B,z,ue,Ee,le,j,Me,xe,Fe,M,ae,H,oe,he;try{const a={alpha:!0,depth:i,stencil:f,antialias:u,premultipliedAlpha:_,preserveDrawingBuffer:F,powerPreference:x,failIfMajorPerformanceCaveat:y};if("setAttribute"in n)n.setAttribute("data-engine",`three.js r${REVISION}`);n.addEventListener("webglcontextlost",Ce,!1);n.addEventListener("webglcontextrestored",ke,!1);n.addEventListener("webglcontextcreationerror",Be,!1);if(E===null){const S="webgl2";E=ot(S,a);if(E===null)if(ot(S))throw Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.");else throw Error("THREE.WebGLRenderer: Error creating WebGL context.")}q()}catch(a){n.removeEventListener("webglcontextlost",Ce,!1);n.removeEventListener("webglcontextrestored",ke,!1);n.removeEventListener("webglcontextcreationerror",Be,!1);error("WebGLRenderer: "+a.message);throw a}function q(){Oe=new ka(E);Oe.init();H=new WebGLUtils(E,Oe);Ye=new Ia(E,Oe,e,H);s=new Ps(E,Oe);if(Ye.reversedDepthBuffer&&N)s.buffers.depth.setReversed(!0);O=E.createFramebuffer();te=E.createFramebuffer();C=E.createFramebuffer();r=new Ka(E);v=new hs;w=new Ls(E,Oe,s,v,Ye,H,r);K=new Wa(p);ne=new qn(E);oe=new Da(E,ne);se=new za(E,ne,r,oe);B=new qa(E,se,ne,oe,r);Fe=new Ya(E,Ye,w);j=new Na(v);z=new ps(p,K,Oe,Ye,oe,j);ue=new Is(p,v);Ee=new _s;le=new xs(Oe);xe=new Ua(p,K,s,B,T,_);Me=new Cs(p,B,Ye);he=new Ns(E,r,Ye,s);M=new wa(E,Oe,r);ae=new Xa(E,Oe,r);r.programs=z.programs;p.capabilities=Ye;p.extensions=Oe;p.properties=v;p.renderLists=Ee;p.shadowMap=Me;p.state=s;p.info=r}if(P!==UnsignedByteType)c=new $a(P,n.width,n.height,u,i,f);const ce=new On(p,E);this.xr=ce;this.getContext=function(){return E};this.getContextAttributes=function(){return E.getContextAttributes()};this.forceContextLoss=function(){const a=Oe.get("WEBGL_lose_context");if(a)a.loseContext()};this.forceContextRestore=function(){const a=Oe.get("WEBGL_lose_context");if(a)a.restoreContext()};this.getPixelRatio=function(){return ie};this.setPixelRatio=function(a){if(a===void 0)return;ie=a;this.setSize(we,V,!1)};this.getSize=function(a){return a.set(we,V)};this.setSize=function(a,S,I=!0){if(ce.isPresenting){warn("WebGLRenderer: Can't change size while VR device is presenting.");return}we=a;V=S;n.width=Math.floor(a*ie);n.height=Math.floor(S*ie);if(I===!0){n.style.width=a+"px";n.style.height=S+"px"}if(c!==null)c.setSize(n.width,n.height);this.setViewport(0,0,a,S)};this.getDrawingBufferSize=function(a){return a.set(we*ie,V*ie).floor()};this.setDrawingBufferSize=function(a,S,I){we=a;V=S;ie=I;n.width=Math.floor(a*I);n.height=Math.floor(S*I);this.setViewport(0,0,a,S)};this.setEffects=function(a){if(P===UnsignedByteType){error("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(a){for(let S=0;S<a.length;S++)if(a[S].isOutputPass===!0){warn("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}c.setEffects(a||[])};this.getCurrentViewport=function(a){return a.copy(J)};this.getViewport=function(a){return a.copy(be)};this.setViewport=function(a,S,I,R){if(a.isVector4)be.set(a.x,a.y,a.z,a.w);else be.set(a,S,I,R);s.viewport(J.copy(be).multiplyScalar(ie).round())};this.getScissor=function(a){return a.copy(Te)};this.setScissor=function(a,S,I,R){if(a.isVector4)Te.set(a.x,a.y,a.z,a.w);else Te.set(a,S,I,R);s.scissor(ee.copy(Te).multiplyScalar(ie).round())};this.getScissorTest=function(){return Qe};this.setScissorTest=function(a){s.setScissorTest(Qe=a)};this.setOpaqueSort=function(a){re=a};this.setTransparentSort=function(a){Re=a};this.getClearColor=function(a){return a.copy(xe.getClearColor())};this.setClearColor=function(){xe.setClearColor(...arguments)};this.getClearAlpha=function(){return xe.getClearAlpha()};this.setClearAlpha=function(){xe.setClearAlpha(...arguments)};this.clear=function(a=!0,S=!0,I=!0){let R=0;if(a){let b=!1;if(G!==null){const de=G.texture.format;b=W.has(de)}if(b){const de=G.texture.type,_e=d.has(de),fe=xe.getClearColor(),ge=xe.getClearAlpha(),{r:Se,g:Le,b:Ue}=fe;if(_e){o[0]=Se;o[1]=Le;o[2]=Ue;o[3]=ge;E.clearBufferuiv(E.COLOR,0,o)}else{U[0]=Se;U[1]=Le;U[2]=Ue;U[3]=ge;E.clearBufferiv(E.COLOR,0,U)}}else R|=E.COLOR_BUFFER_BIT}if(S){R|=E.DEPTH_BUFFER_BIT;this.state.buffers.depth.setMask(!0)}if(I){R|=E.STENCIL_BUFFER_BIT;this.state.buffers.stencil.setMask(4294967295)}if(R!==0)E.clear(R)};this.clearColor=function(){this.clear(!0,!1,!1)};this.clearDepth=function(){this.clear(!1,!0,!1)};this.clearStencil=function(){this.clear(!1,!1,!0)};this.setNodesHandler=function(a){a.setRenderer(this);D=a};this.dispose=function(){n.removeEventListener("webglcontextlost",Ce,!1);n.removeEventListener("webglcontextrestored",ke,!1);n.removeEventListener("webglcontextcreationerror",Be,!1);xe.dispose();Ee.dispose();le.dispose();v.dispose();K.dispose();B.dispose();oe.dispose();he.dispose();z.dispose();ce.dispose();ce.removeEventListener("sessionstart",Xt);ce.removeEventListener("sessionend",Kt);_t.stop()};function Ce(a){a.preventDefault();log("WebGLRenderer: Context Lost.");Z=!0}function ke(){log("WebGLRenderer: Context Restored.");Z=!1;const a=r.autoReset,S=Me.enabled,I=Me.autoUpdate,R=Me.needsUpdate,b=Me.type;q();r.autoReset=a;Me.enabled=S;Me.autoUpdate=I;Me.needsUpdate=R;Me.type=b}function Be(a){error("WebGLRenderer: A WebGL context could not be created. Reason: ",a.statusMessage)}function ct(a){const S=a.target;S.removeEventListener("dispose",ct);ut(S)}function ut(a){Bn(a);v.remove(a)}function Bn(a){const S=v.get(a).programs;if(S!==void 0){S.forEach(function(I){z.releaseProgram(I)});if(a.isShaderMaterial)z.releaseShaderCache(a)}}this.renderBufferDirect=function(a,S,I,R,b,de){if(S===null)S=at;const _e=b.isMesh&&b.matrixWorld.determinantAffine()<0,fe=Vn(a,S,I,R,b);s.setMaterial(R,_e);let ge=I.index,Se=1;if(R.wireframe===!0){ge=se.getWireframeAttribute(I);if(ge===void 0)return;Se=2}const Le=I.drawRange,Ue=I.attributes.position;let ve=Le.start*Se,Ge=(Le.start+Le.count)*Se;if(de!==null){ve=Math.max(ve,de.start*Se);Ge=Math.min(Ge,(de.start+de.count)*Se)}if(ge!==null){ve=Math.max(ve,0);Ge=Math.min(Ge,ge.count)}else if(Ue!==void 0&&Ue!==null){ve=Math.max(ve,0);Ge=Math.min(Ge,Ue.count)}const $e=Ge-ve;if($e<0||$e===1/0)return;oe.setup(b,R,fe,I,ge);let Ke,We=M;if(ge!==null){Ke=ne.get(ge);We=ae;We.setIndex(Ke)}if(b.isMesh)if(R.wireframe===!0){s.setLineWidth(R.wireframeLinewidth*je());We.setMode(E.LINES)}else We.setMode(E.TRIANGLES);else if(b.isLine){let it=R.linewidth;if(it===void 0)it=1;s.setLineWidth(it*je());if(b.isLineSegments)We.setMode(E.LINES);else if(b.isLineLoop)We.setMode(E.LINE_LOOP);else We.setMode(E.LINE_STRIP)}else if(b.isPoints)We.setMode(E.POINTS);else if(b.isSprite)We.setMode(E.TRIANGLES);if(b.isBatchedMesh)if(!Oe.get("WEBGL_multi_draw")){const{_multiDrawStarts:it,_multiDrawCounts:me,_multiDrawCount:rt}=b,ye=ge?ne.get(ge).bytesPerElement:1,lt=v.get(R).currentProgram.getUniforms();for(let ft=0;ft<rt;ft++){lt.setValue(E,"_gl_DrawID",ft);We.render(it[ft]/ye,me[ft])}}else We.renderMultiDraw(b._multiDrawStarts,b._multiDrawCounts,b._multiDrawCount);else if(b.isInstancedMesh)We.renderInstances(ve,$e,b.count);else if(I.isInstancedBufferGeometry){const it=I._maxInstanceCount!==void 0?I._maxInstanceCount:1/0,me=Math.min(I.instanceCount,it);We.renderInstances(ve,$e,me)}else We.render(ve,$e)};function zt(a,S,I,R){if(D!==null&&a.isNodeMaterial)D.setObject(R,a);if(Ie===!0)j.setState(a,I,!1);if(a.transparent===!0&&a.side===DoubleSide&&a.forceSinglePass===!1){a.side=BackSide;a.needsUpdate=!0;Pt(a,S,R);a.side=FrontSide;a.needsUpdate=!0;Pt(a,S,R);a.side=DoubleSide}else Pt(a,S,R)}this.compile=function(a,S,I=null){if(I===null)I=a;if(D!==null)D.renderStart(a,S,I);g=le.get(I);g.init(S);L.push(g);I.traverseVisible(function(b){if(b.isLight&&b.layers.test(S.layers)){g.pushLight(b);if(b.castShadow)g.pushShadow(b)}});if(a!==I)a.traverseVisible(function(b){if(b.isLight&&b.layers.test(S.layers)){g.pushLight(b);if(b.castShadow)g.pushShadow(b)}});g.setupLights();if(D!==null)D.updateLights(g.state.lightsArray);He=this.localClippingEnabled;Ie=j.init(this.clippingPlanes,He);if(Ie===!0)j.setGlobalState(this.clippingPlanes,S);if(D!==null)Me.render(g.state.shadowsArray,I,S);const R=new Set;a.traverse(function(b){if(!(b.isMesh||b.isPoints||b.isLine||b.isSprite))return;const de=b.material;if(de)if(Array.isArray(de))for(let _e=0;_e<de.length;_e++){const fe=de[_e];zt(fe,I,S,b);R.add(fe)}else{zt(de,I,S,b);R.add(de)}});g=L.pop();if(D!==null)D.renderEnd();return R};this.compileAsync=function(a,S,I=null){const R=this.compile(a,S,I);return new Promise((b)=>{function de(){R.forEach(function(_e){const ge=v.get(_e).currentProgram;if(ge===void 0||ge.isReady())R.delete(_e)});if(R.size===0){b(a);return}setTimeout(de,10)}if(Oe.get("KHR_parallel_shader_compile")!==null)de();else setTimeout(de,10)})};let It=null;function Gn(a){if(It)It(a)}function Xt(){_t.stop()}function Kt(){_t.start()}const _t=new nn;_t.setAnimationLoop(Gn);if(typeof self<"u")_t.setContext(self);this.setAnimationLoop=function(a){It=a;ce.setAnimationLoop(a);a===null?_t.stop():_t.start()};ce.addEventListener("sessionstart",Xt);ce.addEventListener("sessionend",Kt);this.render=function(a,S){if(S!==void 0&&S.isCamera!==!0){error("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(Z===!0)return;if(D!==null)D.renderStart(a,S);const I=ce.enabled===!0&&ce.isPresenting===!0,R=c!==null&&(G===null||I)&&c.begin(p,G);if(a.matrixWorldAutoUpdate===!0)a.updateMatrixWorld();if(S.parent===null&&S.matrixWorldAutoUpdate===!0)S.updateMatrixWorld();if(ce.enabled===!0&&ce.isPresenting===!0&&(c===null||c.isCompositing()===!1)){if(ce.cameraAutoUpdate===!0)ce.updateCamera(S);S=ce.getCamera()}if(a.isScene===!0)a.onBeforeRender(p,a,S,G);g=le.get(a,L.length);g.init(S);g.state.textureUnits=w.getTextureUnits();L.push(g);Ne.multiplyMatrices(S.projectionMatrix,S.matrixWorldInverse);De.setFromProjectionMatrix(Ne,WebGLCoordinateSystem,S.reversedDepth);He=this.localClippingEnabled;Ie=j.init(this.clippingPlanes,He);m=Ee.get(a,A.length);m.init();A.push(m);if(ce.enabled===!0&&ce.isPresenting===!0){const _e=p.xr.getDepthSensingMesh();if(_e!==null)Nt(_e,S,-1/0,p.sortObjects)}Nt(a,S,0,p.sortObjects);m.finish();if(D!==null)D.updateLights(g.state.lightsArray);if(p.sortObjects===!0)m.sort(re,Re);Je=ce.enabled===!1||ce.isPresenting===!1||ce.hasDepthSensing()===!1;if(Je)xe.addToRenderList(m,a);this.info.render.frame++;if(this.info.autoReset===!0)this.info.reset();if(Ie===!0)j.beginShadows();const b=g.state.shadowsArray;Me.render(b,a,S);if(Ie===!0)j.endShadows();if((R&&c.hasRenderPass())===!1){const _e=m.opaque,fe=m.transmissive;g.setupLights();if(S.isArrayCamera){const ge=S.cameras;if(fe.length>0)for(let Se=0,Le=ge.length;Se<Le;Se++){const Ue=ge[Se];qt(_e,fe,a,Ue)}if(Je)xe.render(a);for(let Se=0,Le=ge.length;Se<Le;Se++){const Ue=ge[Se];Yt(m,a,Ue,Ue.viewport)}}else{if(fe.length>0)qt(_e,fe,a,S);if(Je)xe.render(a);Yt(m,a,S)}}if(G!==null&&Q===0){w.updateMultisampleRenderTarget(G);w.updateRenderTargetMipmap(G)}if(R)c.end(p);if(a.isScene===!0)a.onAfterRender(p,a,S);oe.resetDefaultState();pe=-1;Y=null;L.pop();if(L.length>0){g=L[L.length-1];w.setTextureUnits(g.state.textureUnits);if(Ie===!0)j.setGlobalState(p.clippingPlanes,g.state.camera)}else g=null;A.pop();if(A.length>0)m=A[A.length-1];else m=null;if(D!==null)D.renderEnd()};function Nt(a,S,I,R){if(a.visible===!1)return;if(a.layers.test(S.layers)){if(a.isGroup)I=a.renderOrder;else if(a.isLOD){if(a.autoUpdate===!0)a.update(S)}else if(a.isLightProbeGrid)g.pushLightProbeGrid(a);else if(a.isLight){g.pushLight(a);if(a.castShadow)g.pushShadow(a)}else if(a.isSprite){if(!a.frustumCulled||a.intersectsFrustum(De)){if(R)Xe.setFromMatrixPosition(a.matrixWorld).applyMatrix4(Ne);const _e=B.update(a),fe=a.material;if(fe.visible)m.push(a,_e,fe,I,Xe.z,null,S)}}else if(a.isMesh||a.isLine||a.isPoints){if(!a.frustumCulled||a.intersectsFrustum(De)){const _e=B.update(a),fe=a.material;if(R){if(a.boundingSphere!==void 0){if(a.boundingSphere===null)a.computeBoundingSphere();Xe.copy(a.boundingSphere.center)}else{if(_e.boundingSphere===null)_e.computeBoundingSphere();Xe.copy(_e.boundingSphere.center)}Xe.applyMatrix4(a.matrixWorld).applyMatrix4(Ne)}if(Array.isArray(fe)){const ge=_e.groups;for(let Se=0,Le=ge.length;Se<Le;Se++){const Ue=ge[Se],ve=fe[Ue.materialIndex];if(ve&&ve.visible)m.push(a,_e,ve,I,Xe.z,Ue,S)}}else if(fe.visible)m.push(a,_e,fe,I,Xe.z,null,S)}}}const de=a.children;for(let _e=0,fe=de.length;_e<fe;_e++)Nt(de[_e],S,I,R)}function Yt(a,S,I,R){const{opaque:b,transmissive:de,transparent:_e}=a;g.setupLightsView(I);if(Ie===!0)j.setGlobalState(p.clippingPlanes,I);if(R)s.viewport(J.copy(R));if(b.length>0)Ct(b,S,I);if(de.length>0)Ct(de,S,I);if(_e.length>0)Ct(_e,S,I);s.buffers.depth.setTest(!0);s.buffers.depth.setMask(!0);s.buffers.color.setMask(!0);s.setPolygonOffset(!1)}function qt(a,S,I,R){if((I.isScene===!0?I.overrideMaterial:null)!==null)return;if(g.state.transmissionRenderTarget[R.id]===void 0){const ve=Oe.has("EXT_color_buffer_half_float")||Oe.has("EXT_color_buffer_float");g.state.transmissionRenderTarget[R.id]=new WebGLRenderTarget(1,1,{generateMipmaps:!0,type:ve?HalfFloatType:UnsignedByteType,minFilter:LinearMipmapLinearFilter,samples:Math.max(4,Ye.samples),stencilBuffer:f,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ColorManagement.workingColorSpace})}const de=g.state.transmissionRenderTarget[R.id],_e=R.viewport||J;de.setSize(_e.z*p.transmissionResolutionScale,_e.w*p.transmissionResolutionScale);const fe=p.getRenderTarget(),ge=p.getActiveCubeFace(),Se=p.getActiveMipmapLevel();p.setRenderTarget(de);p.getClearColor(Ae);Ze=p.getClearAlpha();if(Ze<1)p.setClearColor(16777215,0.5);p.clear();if(Je)xe.render(I);const Le=p.toneMapping;p.toneMapping=NoToneMapping;const Ue=R.viewport;if(R.viewport!==void 0)R.viewport=void 0;g.setupLightsView(R);if(Ie===!0)j.setGlobalState(p.clippingPlanes,R);Ct(a,I,R);w.updateMultisampleRenderTarget(de);w.updateRenderTargetMipmap(de);if(Oe.has("WEBGL_multisampled_render_to_texture")===!1){let ve=!1;for(let Ge=0,$e=S.length;Ge<$e;Ge++){const Ke=S[Ge],{object:We,geometry:it,material:me,group:rt}=Ke;if(me.side===DoubleSide&&We.layers.test(R.layers)){const ye=me.side;me.side=BackSide;me.needsUpdate=!0;Zt(We,I,R,it,me,rt);me.side=ye;me.needsUpdate=!0;ve=!0}}if(ve===!0){w.updateMultisampleRenderTarget(de);w.updateRenderTargetMipmap(de)}}p.setRenderTarget(fe,ge,Se);p.setClearColor(Ae,Ze);if(Ue!==void 0)R.viewport=Ue;p.toneMapping=Le}function Ct(a,S,I){const R=S.isScene===!0?S.overrideMaterial:null;for(let b=0,de=a.length;b<de;b++){const _e=a[b],{object:fe,geometry:ge,group:Se}=_e;let Le=_e.material;if(Le.allowOverride===!0&&R!==null)Le=R;if(fe.layers.test(I.layers))Zt(fe,S,I,ge,Le,Se)}}function Zt(a,S,I,R,b,de){if(D!==null&&b.isNodeMaterial)D.setObject(a,b);a.onBeforeRender(p,S,I,R,b,de);a.modelViewMatrix.multiplyMatrices(I.matrixWorldInverse,a.matrixWorld);a.normalMatrix.getNormalMatrix(a.modelViewMatrix);b.onBeforeRender(p,S,I,R,a,de);if(b.transparent===!0&&b.side===DoubleSide&&b.forceSinglePass===!1){b.side=BackSide;b.needsUpdate=!0;p.renderBufferDirect(I,S,R,b,a,de);b.side=FrontSide;b.needsUpdate=!0;p.renderBufferDirect(I,S,R,b,a,de);b.side=DoubleSide}else p.renderBufferDirect(I,S,R,b,a,de);a.onAfterRender(p,S,I,R,b,de)}function Pt(a,S,I){if(S.isScene!==!0)S=at;const R=v.get(a),b=g.state.lights,de=g.state.shadowsArray,_e=b.state.version,fe=z.getParameters(a,b.state,de,S,I,g.state.lightProbeGridArray),ge=z.getProgramCacheKey(fe);let Se=R.programs;R.environment=a.isMeshStandardMaterial||a.isMeshLambertMaterial||a.isMeshPhongMaterial?S.environment:null;R.fog=S.fog;const Le=a.isMeshStandardMaterial||a.isMeshLambertMaterial&&!a.envMap||a.isMeshPhongMaterial&&!a.envMap;R.envMap=K.get(a.envMap||R.environment,Le);R.envMapRotation=R.environment!==null&&a.envMap===null?S.environmentRotation:a.envMapRotation;if(Se===void 0){a.addEventListener("dispose",ct);Se=new Map;R.programs=Se}let Ue=Se.get(ge);if(Ue!==void 0){if(R.currentProgram===Ue&&R.lightsStateVersion===_e){Qt(a,fe);return Ue}}else{fe.uniforms=z.getUniforms(a);if(D!==null&&a.isNodeMaterial)D.build(a,I,fe);a.onBeforeCompile(fe,p);Ue=z.acquireProgram(fe,ge);Se.set(ge,Ue);R.uniforms=fe.uniforms}const ve=R.uniforms;if(!a.isShaderMaterial&&!a.isRawShaderMaterial||a.clipping===!0)ve.clippingPlanes=j.uniform;Qt(a,fe);R.needsLights=kn(a);R.lightsStateVersion=_e;if(R.needsLights){ve.ambientLightColor.value=b.state.ambient;ve.lightProbe.value=b.state.probe;ve.sunLights.value=b.state.sun;ve.sunLightShadows.value=b.state.sunShadow;ve.directionalLights.value=b.state.directional;ve.directionalLightShadows.value=b.state.directionalShadow;ve.spotLights.value=b.state.spot;ve.spotLightShadows.value=b.state.spotShadow;ve.rectAreaLights.value=b.state.rectArea;ve.ltc_1.value=b.state.rectAreaLTC1;ve.ltc_2.value=b.state.rectAreaLTC2;ve.pointLights.value=b.state.point;ve.pointLightShadows.value=b.state.pointShadow;ve.hemisphereLights.value=b.state.hemi;ve.sunShadowMatrix.value=b.state.sunShadowMatrix;ve.sunShadowCascade.value=b.state.sunShadowCascade;ve.directionalShadowMatrix.value=b.state.directionalShadowMatrix;ve.spotLightMatrix.value=b.state.spotLightMatrix;ve.spotLightMap.value=b.state.spotLightMap;ve.pointShadowMatrix.value=b.state.pointShadowMatrix}R.lightProbeGrid=g.state.lightProbeGridArray.length>0;R.currentProgram=Ue;R.uniformsList=null;return Ue}function $t(a){if(a.uniformsList===null){const S=a.currentProgram.getUniforms();a.uniformsList=bt.seqWithValue(S.seq,a.uniforms)}return a.uniformsList}function Qt(a,S){const I=v.get(a);I.outputColorSpace=S.outputColorSpace;I.batching=S.batching;I.batchingColor=S.batchingColor;I.instancing=S.instancing;I.instancingColor=S.instancingColor;I.instancingMorph=S.instancingMorph;I.skinning=S.skinning;I.morphTargets=S.morphTargets;I.morphNormals=S.morphNormals;I.morphColors=S.morphColors;I.morphTargetsCount=S.morphTargetsCount;I.numClippingPlanes=S.numClippingPlanes;I.numIntersection=S.numClipIntersection;I.vertexAlphas=S.vertexAlphas;I.vertexTangents=S.vertexTangents;I.toneMapping=S.toneMapping}function Hn(a,S){if(a.length===0)return null;if(a.length===1)return a[0].texture!==null?a[0]:null;X.setFromMatrixPosition(S.matrixWorld);for(let I=0,R=a.length;I<R;I++){const b=a[I];if(b.texture!==null&&b.boundingBox.containsPoint(X))return b}return null}function Vn(a,S,I,R,b){if(S.isScene!==!0)S=at;w.resetTextureUnits();const de=S.fog,_e=R.isMeshStandardMaterial||R.isMeshLambertMaterial||R.isMeshPhongMaterial?S.environment:null,fe=G===null?p.outputColorSpace:G.isXRRenderTarget===!0?G.texture.colorSpace:ColorManagement.workingColorSpace,ge=R.isMeshStandardMaterial||R.isMeshLambertMaterial&&!R.envMap||R.isMeshPhongMaterial&&!R.envMap,Se=K.get(R.envMap||_e,ge),Le=R.vertexColors===!0&&!!I.attributes.color&&I.attributes.color.itemSize===4,Ue=!!I.attributes.tangent&&(!!R.normalMap||R.anisotropy>0),ve=!!I.morphAttributes.position,Ge=!!I.morphAttributes.normal,$e=!!I.morphAttributes.color;let Ke=NoToneMapping;if(R.toneMapped){if(G===null||G.isXRRenderTarget===!0)Ke=p.toneMapping}const We=I.morphAttributes.position||I.morphAttributes.normal||I.morphAttributes.color,it=We!==void 0?We.length:0,me=v.get(R),rt=g.state.lights;if(Ie===!0){if(He===!0||a!==Y){const ze=a===Y&&R.id===pe;j.setState(R,a,ze)}}let ye=!1;if(R.version===me.__version){if(me.needsLights&&me.lightsStateVersion!==rt.state.version)ye=!0;else if(me.outputColorSpace!==fe)ye=!0;else if(b.isBatchedMesh&&me.batching===!1)ye=!0;else if(!b.isBatchedMesh&&me.batching===!0)ye=!0;else if(b.isBatchedMesh&&me.batchingColor===!0&&b._colorsTexture===null)ye=!0;else if(b.isBatchedMesh&&me.batchingColor===!1&&b._colorsTexture!==null)ye=!0;else if(b.isInstancedMesh&&me.instancing===!1)ye=!0;else if(!b.isInstancedMesh&&me.instancing===!0)ye=!0;else if(b.isSkinnedMesh&&me.skinning===!1)ye=!0;else if(!b.isSkinnedMesh&&me.skinning===!0)ye=!0;else if(b.isInstancedMesh&&me.instancingColor===!0&&b.instanceColor===null)ye=!0;else if(b.isInstancedMesh&&me.instancingColor===!1&&b.instanceColor!==null)ye=!0;else if(b.isInstancedMesh&&me.instancingMorph===!0&&b.morphTexture===null)ye=!0;else if(b.isInstancedMesh&&me.instancingMorph===!1&&b.morphTexture!==null)ye=!0;else if(me.envMap!==Se)ye=!0;else if(R.fog===!0&&me.fog!==de)ye=!0;else if(me.numClippingPlanes!==void 0&&(me.numClippingPlanes!==j.numPlanes||me.numIntersection!==j.numIntersection))ye=!0;else if(me.vertexAlphas!==Le)ye=!0;else if(me.vertexTangents!==Ue)ye=!0;else if(me.morphTargets!==ve)ye=!0;else if(me.morphNormals!==Ge)ye=!0;else if(me.morphColors!==$e)ye=!0;else if(me.toneMapping!==Ke)ye=!0;else if(me.morphTargetsCount!==it)ye=!0;else if(!!me.lightProbeGrid!==g.state.lightProbeGridArray.length>0)ye=!0}else{ye=!0;me.__version=R.version}let lt=me.currentProgram;if(ye===!0){lt=Pt(R,S,b);if(D&&R.isNodeMaterial)D.onUpdateProgram(R,lt,me)}let ft=!1,pt=!1,vt=!1;const Ve=lt.getUniforms(),qe=me.uniforms;if(s.useProgram(lt.program)){ft=!0;pt=!0;vt=!0}if(R.id!==pe){pe=R.id;pt=!0}if(me.needsLights){const ze=Hn(g.state.lightProbeGridArray,b);if(me.lightProbeGrid!==ze){me.lightProbeGrid=ze;pt=!0}}if(ft||Y!==a){if(s.buffers.depth.getReversed()&&a.reversedDepth!==!0){a._reversedDepth=!0;a.updateProjectionMatrix()}Ve.setValue(E,"projectionMatrix",a.projectionMatrix);Ve.setValue(E,"viewMatrix",a.matrixWorldInverse);const mt=Ve.map.cameraPosition;if(mt!==void 0)mt.setValue(E,nt.setFromMatrixPosition(a.matrixWorld));if(Ye.logarithmicDepthBuffer)Ve.setValue(E,"logDepthBufFC",2/(Math.log(a.far+1)/Math.LN2));if(R.isMeshPhongMaterial||R.isMeshToonMaterial||R.isMeshLambertMaterial||R.isMeshBasicMaterial||R.isMeshStandardMaterial||R.isShaderMaterial)Ve.setValue(E,"isOrthographic",a.isOrthographicCamera===!0);if(Y!==a){Y=a;pt=!0;vt=!0}}if(me.needsLights){if(rt.state.sunShadowMap.length>0)Ve.setValue(E,"sunShadowMap",rt.state.sunShadowMap,w);if(rt.state.directionalShadowMap.length>0)Ve.setValue(E,"directionalShadowMap",rt.state.directionalShadowMap,w);if(rt.state.spotShadowMap.length>0)Ve.setValue(E,"spotShadowMap",rt.state.spotShadowMap,w);if(rt.state.pointShadowMap.length>0)Ve.setValue(E,"pointShadowMap",rt.state.pointShadowMap,w)}if(b.isSkinnedMesh){Ve.setOptional(E,b,"bindMatrix");Ve.setOptional(E,b,"bindMatrixInverse");const ze=b.skeleton;if(ze){if(ze.boneTexture===null)ze.computeBoneTexture();Ve.setValue(E,"boneTexture",ze.boneTexture,w)}}if(b.isBatchedMesh){Ve.setOptional(E,b,"batchingTexture");Ve.setValue(E,"batchingTexture",b._matricesTexture,w);Ve.setOptional(E,b,"batchingIdTexture");Ve.setValue(E,"batchingIdTexture",b._indirectTexture,w);Ve.setOptional(E,b,"batchingColorTexture");if(b._colorsTexture!==null)Ve.setValue(E,"batchingColorTexture",b._colorsTexture,w)}const ht=I.morphAttributes;if(ht.position!==void 0||ht.normal!==void 0||ht.color!==void 0)Fe.update(b,I,lt);if(pt||me.receiveShadow!==b.receiveShadow){me.receiveShadow=b.receiveShadow;Ve.setValue(E,"receiveShadow",b.receiveShadow)}if((R.isMeshStandardMaterial||R.isMeshLambertMaterial||R.isMeshPhongMaterial)&&R.envMap===null&&S.environment!==null)qe.envMapIntensity.value=S.environmentIntensity;if(qe.dfgLUT!==void 0)qe.dfgLUT.value=Fs();if(pt){Ve.setValue(E,"toneMappingExposure",p.toneMappingExposure);if(me.needsLights)Wn(qe,vt);if(de&&R.fog===!0)ue.refreshFogUniforms(qe,de);ue.refreshMaterialUniforms(qe,R,ie,V,g.state.transmissionRenderTarget[a.id]);if(me.needsLights&&me.lightProbeGrid){const ze=me.lightProbeGrid;qe.probesSH.value=ze.texture;qe.probesMin.value.copy(ze.boundingBox.min);qe.probesMax.value.copy(ze.boundingBox.max);qe.probesResolution.value.copy(ze.resolution)}bt.upload(E,$t(me),qe,w)}if(R.isShaderMaterial&&R.uniformsNeedUpdate===!0){bt.upload(E,$t(me),qe,w);R.uniformsNeedUpdate=!1}if(R.isSpriteMaterial)Ve.setValue(E,"center",b.center);Ve.setValue(E,"modelViewMatrix",b.modelViewMatrix);Ve.setValue(E,"normalMatrix",b.normalMatrix);Ve.setValue(E,"modelMatrix",b.matrixWorld);if(R.uniformsGroups!==void 0){const ze=R.uniformsGroups;for(let mt=0,St=ze.length;mt<St;mt++){const jt=ze[mt];he.update(jt,lt);he.bind(jt,lt)}}return lt}function Wn(a,S){a.ambientLightColor.needsUpdate=S;a.lightProbe.needsUpdate=S;a.sunLights.needsUpdate=S;a.sunLightShadows.needsUpdate=S;a.directionalLights.needsUpdate=S;a.directionalLightShadows.needsUpdate=S;a.pointLights.needsUpdate=S;a.pointLightShadows.needsUpdate=S;a.spotLights.needsUpdate=S;a.spotLightShadows.needsUpdate=S;a.rectAreaLights.needsUpdate=S;a.hemisphereLights.needsUpdate=S}function kn(a){return a.isMeshLambertMaterial||a.isMeshToonMaterial||a.isMeshPhongMaterial||a.isMeshStandardMaterial||a.isShadowMaterial||a.isShaderMaterial&&a.lights===!0}this.getActiveCubeFace=function(){return k};this.getActiveMipmapLevel=function(){return Q};this.getRenderTarget=function(){return G};this.setRenderTargetTextures=function(a,S,I){const R=v.get(a);R.__autoAllocateDepthBuffer=a.resolveDepthBuffer===!1;if(R.__autoAllocateDepthBuffer===!1)R.__useRenderToTexture=!1;v.get(a.texture).__webglTexture=S;v.get(a.depthTexture).__webglTexture=R.__autoAllocateDepthBuffer?void 0:I;R.__hasExternalTextures=!0};this.setRenderTargetFramebuffer=function(a,S){const I=v.get(a);I.__webglFramebuffer=S;I.__useDefaultFramebuffer=S===void 0};this.setRenderTarget=function(a,S=0,I=0){G=a;k=S;Q=I;let R=null,b=!1,de=!1;if(a){const fe=v.get(a);if(fe.__useDefaultFramebuffer!==void 0){s.bindFramebuffer(E.FRAMEBUFFER,fe.__webglFramebuffer);J.copy(a.viewport);ee.copy(a.scissor);Pe=a.scissorTest;s.viewport(J);s.scissor(ee);s.setScissorTest(Pe);pe=-1;return}else if(fe.__webglFramebuffer===void 0)w.setupRenderTarget(a);else if(fe.__hasExternalTextures)w.rebindTextures(a,v.get(a.texture).__webglTexture,v.get(a.depthTexture).__webglTexture);else if(a.depthBuffer){const Le=a.depthTexture;if(fe.__boundDepthTexture!==Le){if(Le!==null&&v.has(Le)&&(a.width!==Le.image.width||a.height!==Le.image.height))throw Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");w.setupDepthRenderbuffer(a)}}const ge=a.texture;if(ge.isData3DTexture||ge.isDataArrayTexture||ge.isCompressedArrayTexture)de=!0;const Se=v.get(a).__webglFramebuffer;if(a.isWebGLCubeRenderTarget){if(Array.isArray(Se[S]))R=Se[S][I];else R=Se[S];b=!0}else if(a.samples>0&&w.useMultisampledRTT(a)===!1)R=v.get(a).__webglMultisampledFramebuffer;else if(Array.isArray(Se))R=Se[I];else R=Se;J.copy(a.viewport);ee.copy(a.scissor);Pe=a.scissorTest}else{J.copy(be).multiplyScalar(ie).floor();ee.copy(Te).multiplyScalar(ie).floor();Pe=Qe}if(I!==0)R=O;if(s.bindFramebuffer(E.FRAMEBUFFER,R))s.drawBuffers(a,R);s.viewport(J);s.scissor(ee);s.setScissorTest(Pe);if(b){const fe=v.get(a.texture);E.framebufferTexture2D(E.FRAMEBUFFER,E.COLOR_ATTACHMENT0,E.TEXTURE_CUBE_MAP_POSITIVE_X+S,fe.__webglTexture,I)}else if(de){const fe=S;for(let ge=0;ge<a.textures.length;ge++){const Se=v.get(a.textures[ge]);E.framebufferTextureLayer(E.FRAMEBUFFER,E.COLOR_ATTACHMENT0+ge,Se.__webglTexture,I,fe)}}else if(a!==null&&I!==0){const fe=v.get(a.texture);E.framebufferTexture2D(E.FRAMEBUFFER,E.COLOR_ATTACHMENT0,E.TEXTURE_2D,fe.__webglTexture,I)}pe=-1};function Jt(a){const S=v.get(a);if(S.__readFormat!==a.format||S.__readType!==a.type){S.__readFormat=a.format;S.__readType=a.type;S.__formatReadable=Ye.textureFormatReadable(a.format);S.__typeReadable=Ye.textureTypeReadable(a.type)}return S}this.readRenderTargetPixels=function(a,S,I,R,b,de,_e,fe=0){if(!(a&&a.isWebGLRenderTarget)){error("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ge=v.get(a).__webglFramebuffer;if(a.isWebGLCubeRenderTarget&&_e!==void 0)ge=ge[_e];if(ge){s.bindFramebuffer(E.FRAMEBUFFER,ge);try{const Se=a.textures[fe],{format:Le,type:Ue}=Se;if(a.textures.length>1)E.readBuffer(E.COLOR_ATTACHMENT0+fe);const ve=Jt(Se);if(ve.__formatReadable===!1){error("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(ve.__typeReadable===!1){error("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}if(S>=0&&S<=a.width-R&&(I>=0&&I<=a.height-b))E.readPixels(S,I,R,b,H.convert(Le),H.convert(Ue),de)}finally{const Se=G!==null?v.get(G).__webglFramebuffer:null;s.bindFramebuffer(E.FRAMEBUFFER,Se)}}};this.readRenderTargetPixelsAsync=async function(a,S,I,R,b,de,_e,fe=0){if(!(a&&a.isWebGLRenderTarget))throw Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ge=v.get(a).__webglFramebuffer;if(a.isWebGLCubeRenderTarget&&_e!==void 0)ge=ge[_e];if(ge)if(S>=0&&S<=a.width-R&&(I>=0&&I<=a.height-b)){s.bindFramebuffer(E.FRAMEBUFFER,ge);const Se=a.textures[fe],{format:Le,type:Ue}=Se;if(a.textures.length>1)E.readBuffer(E.COLOR_ATTACHMENT0+fe);const ve=Jt(Se);if(ve.__formatReadable===!1)throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(ve.__typeReadable===!1)throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ge=E.createBuffer();E.bindBuffer(E.PIXEL_PACK_BUFFER,Ge);E.bufferData(E.PIXEL_PACK_BUFFER,de.byteLength,E.STREAM_READ);E.readPixels(S,I,R,b,H.convert(Le),H.convert(Ue),0);E.bindBuffer(E.PIXEL_PACK_BUFFER,null);const $e=G!==null?v.get(G).__webglFramebuffer:null;s.bindFramebuffer(E.FRAMEBUFFER,$e);const Ke=E.fenceSync(E.SYNC_GPU_COMMANDS_COMPLETE,0);E.flush();await Yn(E,Ke,4);E.bindBuffer(E.PIXEL_PACK_BUFFER,Ge);E.getBufferSubData(E.PIXEL_PACK_BUFFER,0,de);E.bindBuffer(E.PIXEL_PACK_BUFFER,null);E.deleteBuffer(Ge);E.deleteSync(Ke);return de}else throw Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")};this.copyFramebufferToTexture=function(a,S=null,I=0){const R=Math.pow(2,-I),b=Math.floor(a.image.width*R),de=Math.floor(a.image.height*R),_e=S!==null?S.x:0,fe=S!==null?S.y:0;w.setTexture2D(a,0);E.copyTexSubImage2D(E.TEXTURE_2D,I,0,0,_e,fe,b,de);s.unbindTexture()};this.copyTextureToTexture=function(a,S,I=null,R=null,b=0,de=0){let _e,fe,ge,Se,Le,Ue,ve,Ge,$e;const Ke=a.isCompressedTexture?a.mipmaps[de]:a.image;if(I!==null){_e=I.max.x-I.min.x;fe=I.max.y-I.min.y;ge=I.isBox3?I.max.z-I.min.z:1;Se=I.min.x;Le=I.min.y;Ue=I.isBox3?I.min.z:0}else{const qe=Math.pow(2,-b);_e=Math.floor(Ke.width*qe);fe=Math.floor(Ke.height*qe);if(a.isDataArrayTexture)ge=Ke.depth;else if(a.isData3DTexture)ge=Math.floor(Ke.depth*qe);else ge=1;Se=0;Le=0;Ue=0}if(R!==null){ve=R.x;Ge=R.y;$e=R.z}else{ve=0;Ge=0;$e=0}const We=H.convert(S.format),it=H.convert(S.type);let me;if(S.isData3DTexture){w.setTexture3D(S,0);me=E.TEXTURE_3D}else if(S.isDataArrayTexture||S.isCompressedArrayTexture){w.setTexture2DArray(S,0);me=E.TEXTURE_2D_ARRAY}else{w.setTexture2D(S,0);me=E.TEXTURE_2D}s.activeTexture(E.TEXTURE0);s.pixelStorei(E.UNPACK_FLIP_Y_WEBGL,S.flipY);s.pixelStorei(E.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha);s.pixelStorei(E.UNPACK_ALIGNMENT,S.unpackAlignment);const rt=s.getParameter(E.UNPACK_ROW_LENGTH),ye=s.getParameter(E.UNPACK_IMAGE_HEIGHT),lt=s.getParameter(E.UNPACK_SKIP_PIXELS),ft=s.getParameter(E.UNPACK_SKIP_ROWS),pt=s.getParameter(E.UNPACK_SKIP_IMAGES);s.pixelStorei(E.UNPACK_ROW_LENGTH,Ke.width);s.pixelStorei(E.UNPACK_IMAGE_HEIGHT,Ke.height);s.pixelStorei(E.UNPACK_SKIP_PIXELS,Se);s.pixelStorei(E.UNPACK_SKIP_ROWS,Le);s.pixelStorei(E.UNPACK_SKIP_IMAGES,Ue);const vt=a.isDataArrayTexture||a.isData3DTexture,Ve=S.isDataArrayTexture||S.isData3DTexture;if(a.isDepthTexture){const qe=v.get(a),ht=v.get(S),ze=v.get(qe.__renderTarget),mt=v.get(ht.__renderTarget);s.bindFramebuffer(E.READ_FRAMEBUFFER,ze.__webglFramebuffer);s.bindFramebuffer(E.DRAW_FRAMEBUFFER,mt.__webglFramebuffer);for(let St=0;St<ge;St++){if(vt){E.framebufferTextureLayer(E.READ_FRAMEBUFFER,E.COLOR_ATTACHMENT0,v.get(a).__webglTexture,b,Ue+St);E.framebufferTextureLayer(E.DRAW_FRAMEBUFFER,E.COLOR_ATTACHMENT0,v.get(S).__webglTexture,de,$e+St)}E.blitFramebuffer(Se,Le,_e,fe,ve,Ge,_e,fe,E.DEPTH_BUFFER_BIT,E.NEAREST)}s.bindFramebuffer(E.READ_FRAMEBUFFER,null);s.bindFramebuffer(E.DRAW_FRAMEBUFFER,null)}else if(b!==0||a.isRenderTargetTexture||v.has(a)){const qe=v.get(a),ht=v.get(S);s.bindFramebuffer(E.READ_FRAMEBUFFER,te);s.bindFramebuffer(E.DRAW_FRAMEBUFFER,C);for(let ze=0;ze<ge;ze++){if(vt)E.framebufferTextureLayer(E.READ_FRAMEBUFFER,E.COLOR_ATTACHMENT0,qe.__webglTexture,b,Ue+ze);else E.framebufferTexture2D(E.READ_FRAMEBUFFER,E.COLOR_ATTACHMENT0,E.TEXTURE_2D,qe.__webglTexture,b);if(Ve)E.framebufferTextureLayer(E.DRAW_FRAMEBUFFER,E.COLOR_ATTACHMENT0,ht.__webglTexture,de,$e+ze);else E.framebufferTexture2D(E.DRAW_FRAMEBUFFER,E.COLOR_ATTACHMENT0,E.TEXTURE_2D,ht.__webglTexture,de);if(b!==0)E.blitFramebuffer(Se,Le,_e,fe,ve,Ge,_e,fe,E.COLOR_BUFFER_BIT,E.NEAREST);else if(Ve)E.copyTexSubImage3D(me,de,ve,Ge,$e+ze,Se,Le,_e,fe);else E.copyTexSubImage2D(me,de,ve,Ge,Se,Le,_e,fe)}s.bindFramebuffer(E.READ_FRAMEBUFFER,null);s.bindFramebuffer(E.DRAW_FRAMEBUFFER,null)}else if(Ve)if(a.isDataTexture||a.isData3DTexture)E.texSubImage3D(me,de,ve,Ge,$e,_e,fe,ge,We,it,Ke.data);else if(S.isCompressedArrayTexture)E.compressedTexSubImage3D(me,de,ve,Ge,$e,_e,fe,ge,We,Ke.data);else E.texSubImage3D(me,de,ve,Ge,$e,_e,fe,ge,We,it,Ke);else if(a.isDataTexture)E.texSubImage2D(E.TEXTURE_2D,de,ve,Ge,_e,fe,We,it,Ke.data);else if(a.isCompressedTexture)E.compressedTexSubImage2D(E.TEXTURE_2D,de,ve,Ge,Ke.width,Ke.height,We,Ke.data);else E.texSubImage2D(E.TEXTURE_2D,de,ve,Ge,_e,fe,We,it,Ke);s.pixelStorei(E.UNPACK_ROW_LENGTH,rt);s.pixelStorei(E.UNPACK_IMAGE_HEIGHT,ye);s.pixelStorei(E.UNPACK_SKIP_PIXELS,lt);s.pixelStorei(E.UNPACK_SKIP_ROWS,ft);s.pixelStorei(E.UNPACK_SKIP_IMAGES,pt);if(de===0&&S.generateMipmaps)E.generateMipmap(me);s.unbindTexture()};this.initRenderTarget=function(a){if(v.get(a).__webglFramebuffer===void 0)w.setupRenderTarget(a)};this.initTexture=function(a){if(a.isCubeTexture)w.setTextureCube(a,0);else if(a.isData3DTexture)w.setTexture3D(a,0);else if(a.isDataArrayTexture||a.isCompressedArrayTexture)w.setTexture2DArray(a,0);else w.setTexture2D(a,0);s.unbindTexture()};this.resetState=function(){k=0;Q=0;G=null;s.reset();oe.reset()};if(typeof __THREE_DEVTOOLS__<"u")__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return WebGLCoordinateSystem}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const n=this.getContext();n.drawingBufferColorSpace=ColorManagement._getDrawingBufferColorSpace(e);n.unpackColorSpace=ColorManagement._getUnpackColorSpace()}}export{ACESFilmicToneMapping,AddEquation,AddOperation,AdditiveBlending,AgXToneMapping,AlphaFormat,AlwaysCompare,AlwaysDepth,ArrayCamera,BackSide,BoxGeometry,BufferAttribute,BufferGeometry,ByteType,CineonToneMapping,ClampToEdgeWrapping,Color,ColorManagement,ConstantAlphaFactor,ConstantColorFactor,CubeCamera,CubeDepthTexture,CubeReflectionMapping,CubeRefractionMapping,CubeTexture,CubeUVReflectionMapping,CullFaceBack,CullFaceFront,CullFaceNone,CustomBlending,CustomToneMapping,Data3DTexture,DataArrayTexture,DataTexture,DepthFormat,DepthStencilFormat,DepthTexture,DoubleSide,DstAlphaFactor,DstColorFactor,EqualCompare,EqualDepth,EquirectangularReflectionMapping,EquirectangularRefractionMapping,EventDispatcher,ExternalTexture,Float32BufferAttribute,FloatType,FrontSide,Frustum,GLSL3,GreaterCompare,GreaterDepth,GreaterEqualCompare,GreaterEqualDepth,HalfFloatType,IntType,Layers,LessCompare,LessDepth,LessEqualCompare,LessEqualDepth,LinearFilter,LinearMipmapLinearFilter,LinearMipmapNearestFilter,LinearSRGBColorSpace,LinearToneMapping,LinearTransfer,Matrix3,Matrix4,MaxEquation,Mesh,MeshBasicMaterial,MeshDepthMaterial,MeshDistanceMaterial,MinEquation,MirroredRepeatWrapping,MixOperation,MultiplyBlending,MultiplyOperation,NearestFilter,NearestMipmapLinearFilter,NearestMipmapNearestFilter,NeutralToneMapping,NeverCompare,NeverDepth,NoBlending,NoColorSpace,NoToneMapping,NormalBlending,NotEqualCompare,NotEqualDepth,ObjectSpaceNormalMap,OneFactor,OneMinusConstantAlphaFactor,OneMinusConstantColorFactor,OneMinusDstAlphaFactor,OneMinusDstColorFactor,OneMinusSrcAlphaFactor,OneMinusSrcColorFactor,OrthographicCamera,PCFShadowMap,PCFSoftShadowMap,PMREMGenerator,PerspectiveCamera,Plane,PlaneGeometry,R11_EAC_Format,RED_GREEN_RGTC2_Format,RED_RGTC1_Format,REVISION,RG11_EAC_Format,RGBAFormat,RGBAIntegerFormat,RGBA_ASTC_10x10_Format,RGBA_ASTC_10x5_Format,RGBA_ASTC_10x6_Format,RGBA_ASTC_10x8_Format,RGBA_ASTC_12x10_Format,RGBA_ASTC_12x12_Format,RGBA_ASTC_4x4_Format,RGBA_ASTC_5x4_Format,RGBA_ASTC_5x5_Format,RGBA_ASTC_6x5_Format,RGBA_ASTC_6x6_Format,RGBA_ASTC_8x5_Format,RGBA_ASTC_8x6_Format,RGBA_ASTC_8x8_Format,RGBA_BPTC_Format,RGBA_ETC2_EAC_Format,RGBA_PVRTC_2BPPV1_Format,RGBA_PVRTC_4BPPV1_Format,RGBA_S3TC_DXT1_Format,RGBA_S3TC_DXT3_Format,RGBA_S3TC_DXT5_Format,RGBFormat,RGB_BPTC_SIGNED_Format,RGB_BPTC_UNSIGNED_Format,RGB_ETC1_Format,RGB_ETC2_Format,RGB_PVRTC_2BPPV1_Format,RGB_PVRTC_4BPPV1_Format,RGB_S3TC_DXT1_Format,RGFormat,RGIntegerFormat,RawShaderMaterial,RedFormat,RedIntegerFormat,ReinhardToneMapping,RepeatWrapping,ReverseSubtractEquation,SIGNED_R11_EAC_Format,SIGNED_RED_GREEN_RGTC2_Format,SIGNED_RED_RGTC1_Format,SIGNED_RG11_EAC_Format,SRGBColorSpace,SRGBTransfer,ShaderChunk,ShaderLib,ShaderMaterial,ShortType,SrcAlphaFactor,SrcAlphaSaturateFactor,SrcColorFactor,SubtractEquation,SubtractiveBlending,TangentSpaceNormalMap,Texture,Uint16BufferAttribute,Uint32BufferAttribute,UniformsLib,UniformsUtils,UnsignedByteType,UnsignedInt101111Type,UnsignedInt248Type,UnsignedInt5999Type,UnsignedIntType,UnsignedShort4444Type,UnsignedShort5551Type,UnsignedShortType,VSMShadowMap,Vector2,Vector3,Vector4,WebGLCoordinateSystem,WebGLCubeRenderTarget,WebGLRenderTarget,WebGLRenderer,WebGLUtils,WebXRController,ZeroFactor,createCanvasElement,error,log,warn,warnOnce};