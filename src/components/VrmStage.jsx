import {
  Badge,
  Box,
  Flex,
  Heading,
  SimpleGrid,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import {
  AmbientLight,
  Clock,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  VRMExpressionPresetName,
  VRMLoaderPlugin,
  VRMUtils
} from '@pixiv/three-vrm';
import useAppStore from '../store/useAppStore.js';

const visemePresets = [
  { id: 'aa', label: 'A', preset: VRMExpressionPresetName.AA },
  { id: 'ih', label: 'I', preset: VRMExpressionPresetName.IH },
  { id: 'ou', label: 'U', preset: VRMExpressionPresetName.OU },
  { id: 'ee', label: 'E', preset: VRMExpressionPresetName.EE },
  { id: 'oh', label: 'O', preset: VRMExpressionPresetName.OH }
];

const DEFAULT_MODEL_PATH = `${import.meta.env.BASE_URL}models/sample.vrm`;

const VrmStage = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const vrmRef = useRef(null);
  const lastLoggedAARef = useRef(null);
  const controlsRef = useRef(null);
  const visemeValuesRef = useRef(
    visemePresets.reduce((acc, preset) => {
      acc[preset.id] = 0;
      return acc;
    }, {})
  );
  const [status, setStatus] = useState('モデル読み込み中…');
  const [fps, setFps] = useState(0);
  const fpsSampleRef = useRef({ last: performance.now(), count: 0 });
  const { currentViseme, setViseme, visemeWeights } = useAppStore((state) => ({
    currentViseme: state.currentViseme,
    setViseme: state.setViseme,
    visemeWeights: state.visemeWeights
  }));
  const sliderBg = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new Scene();
    scene.background = new Color('#f5f6fb');

    const camera = new PerspectiveCamera(
      35,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    camera.position.set(0, 1.3, 2.4);

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target = new Vector3(0, 1.3, 0);
    controls.update();

    const ambient = new AmbientLight(0xffffff, 1);
    const directional = new DirectionalLight(0xffffff, 1.2);
    directional.position.set(1, 1.5, 1);
    scene.add(ambient);
    scene.add(directional);

    rendererRef.current = renderer;
    controlsRef.current = controls;

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser, { autoUpdateHumanBones: true }));
    loader.load(
      DEFAULT_MODEL_PATH,
      async (gltf) => {
        try {
          const vrm = gltf.userData.vrm;
          if (!vrm) {
            throw new Error('VRM データが見つかりませんでした。');
          }
          VRMUtils.removeUnnecessaryJoints(vrm.scene);
          vrm.scene.rotation.y = Math.PI; // face camera
          scene.add(vrm.scene);
          vrmRef.current = vrm;
          setStatus('モデル準備完了');
        } catch (error) {
          console.error(error);
          setStatus('VRM の読み込みに失敗しました。');
        }
      },
      undefined,
      (error) => {
        console.error(error);
        setStatus('VRM の読み込みに失敗しました。');
      }
    );

    const clock = new Clock();
    let animationId = 0;
    const renderLoop = () => {
      animationId = requestAnimationFrame(renderLoop);
      const delta = clock.getDelta();
      controls.update();

      const vrm = vrmRef.current;
      if (vrm) {
        vrm.update(delta);
        const expression = vrm.expressionManager;
        if (expression) {
          Object.entries(visemeValuesRef.current).forEach(([key, value]) => {
            const preset = visemePresets.find((item) => item.id === key)?.preset;
            if (preset) {
              expression.setValue(preset, value);
            }
          });
          const aaWeight = expression.getValue(VRMExpressionPresetName.AA);
          if (aaWeight !== null) {
            const previous = lastLoggedAARef.current;
            if (previous === null || Math.abs(previous - aaWeight) >= 0.01) {
              const roundedAA = Math.round(aaWeight * 100) / 100;
              console.log('[VRM] expression.getValue("aa"):', roundedAA);
              lastLoggedAARef.current = aaWeight;
            }
          }
        }
      }

      renderer.render(scene, camera);

      const now = performance.now();
      fpsSampleRef.current.count += 1;
      if (now - fpsSampleRef.current.last > 500) {
        const frameRate =
          (fpsSampleRef.current.count / (now - fpsSampleRef.current.last)) * 1000;
        setFps(Math.round(frameRate));
        fpsSampleRef.current.count = 0;
        fpsSampleRef.current.last = now;
      }
    };
    renderLoop();

    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const { clientWidth, clientHeight } = container;
      camera.aspect = clientWidth / clientHeight || 1;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(clientWidth, clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry?.dispose?.();
          if (object.material?.map) {
            object.material.map.dispose?.();
          }
          object.material?.dispose?.();
        }
      });
      vrmRef.current = null;
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    const vrm = vrmRef.current;
    const expression = vrm?.expressionManager;
    if (!visemeWeights || (!expression && Object.keys(visemeWeights).length === 0)) {
      return;
    }

    let updatedValues = false;
    const nextValues = { ...visemeValuesRef.current };
    visemePresets.forEach((preset) => {
      if (typeof visemeWeights[preset.id] === 'number') {
        const weight = visemeWeights[preset.id];
        nextValues[preset.id] = weight;
        if (expression) {
          expression.setValue(preset.preset, weight);
        }
        updatedValues = true;
      }
    });

    if (updatedValues) {
      visemeValuesRef.current = nextValues;
      if (expression && typeof expression.update === 'function') {
        expression.update();
      }
    }
  }, [visemeWeights]);

  const handleVisemeChange = (presetId, value) => {
    visemeValuesRef.current = {
      ...visemeValuesRef.current,
      [presetId]: value
    };
    setViseme(presetId, value);
  };

  return (
    <Stack spacing={4} height="100%" role="region" aria-label="VRM ステージ">
      <Box position="relative" borderRadius="lg" overflow="hidden" flex="1">
        <Box
          ref={containerRef}
          height={{ base: '320px', md: '100%' }}
          minH="320px"
          aria-label="3D モデルビューア"
        />
        <Badge position="absolute" top={4} left={4} colorScheme="blue">
          {status}
        </Badge>
        <Badge position="absolute" top={4} right={4} colorScheme="purple">
          FPS: {fps}
        </Badge>
      </Box>
      <Stack spacing={3}>
        <Heading size="sm">擬似リップシンク</Heading>
        <Text fontSize="xs" color="gray.500">
          スライダーで口形を変更できます。外部解析の値は setViseme(type) で差し替え可能です。
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
          {visemePresets.map((preset) => (
            <Box
              key={preset.id}
              p={3}
              borderWidth="1px"
              borderRadius="md"
              bg={sliderBg}
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" fontWeight="medium">
                  {preset.label}
                </Text>
                {currentViseme === preset.id && (
                  <Badge colorScheme="green">live</Badge>
                )}
              </Flex>
              <Slider
                aria-label={`${preset.label} 口形`}
                min={0}
                max={1}
                step={0.05}
                defaultValue={0}
                onChange={(value) => handleVisemeChange(preset.id, value)}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          ))}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
};

export default VrmStage;
