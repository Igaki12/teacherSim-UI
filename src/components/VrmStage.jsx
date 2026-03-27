import {
  Badge,
  Box,
  Button,
  IconButton,
  Image,
  Stack,
  Text,
  useBreakpointValue,
  useColorModeValue
} from '@chakra-ui/react';
import { RepeatIcon, ViewIcon } from '@chakra-ui/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AmbientLight,
  Clock,
  Color,
  DirectionalLight,
  MathUtils,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMHumanBoneName, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import useAppStore from '../store/useAppStore.js';
import ChatComposer from './ChatComposer.jsx';

const EXPRESSION_PRESETS = [
  { key: 'happy', label: '喜', description: '喜（ハッピー）' },
  { key: 'angry', label: '怒', description: '怒（アングリー）' },
  { key: 'sad', label: '哀', description: '哀（サッド）' },
  { key: 'relaxed', label: '楽', description: '楽（リラックス）' },
  { key: 'surprised', label: '驚', description: '驚（サプライズ）' }
];
const BACKGROUND_PRESETS = [
  {
    key: 'playground',
    label: '運動会グラウンド',
    sources: {
      base: `${import.meta.env.BASE_URL}vrm-bg-imgs/school-playground-01-wide.png`,
      md: `${import.meta.env.BASE_URL}vrm-bg-imgs/school-playground-01-wide.png`,
      lg: `${import.meta.env.BASE_URL}vrm-bg-imgs/school-playground-01-wide.png`
    }
  },
  {
    key: 'entrance-wide',
    label: '校門（横）',
    sources: {
      base: `${import.meta.env.BASE_URL}vrm-bg-imgs/school-entrance-01-wide.png`,
      md: `${import.meta.env.BASE_URL}vrm-bg-imgs/school-entrance-01-wide.png`,
      lg: `${import.meta.env.BASE_URL}vrm-bg-imgs/school-entrance-01-wide.png`
    }
  },
  {
    key: 'classroom',
    label: '教室',
    sources: {
      base: `${import.meta.env.BASE_URL}vrm-bg-imgs/school-classroom-01-wide.png`,
      md: `${import.meta.env.BASE_URL}vrm-bg-imgs/school-classroom-01-wide.png`,
      lg: `${import.meta.env.BASE_URL}vrm-bg-imgs/school-classroom-01-wide.png`
    }
  }
];
const MODEL_PRESETS = [
  {
    id: 'sample',
    label: 'Sample VRM',
    path: `${import.meta.env.BASE_URL}models/sample.vrm`,
    initialCameraPosition: { x: 0, y: 1.3, z: 2.4 },
    initialTarget: { x: 0, y: 1.3, z: 0 },
    frontPoseCameraPosition: { x: 0, y: 1.45, z: 1.1 },
    frontPoseTarget: { x: 0, y: 1.45, z: 0 },
    sceneRotationY: Math.PI,
    frontPoseSceneRotationY: 0
  },
  {
    id: 'trial_2',
    label: 'Trial 2 VRM',
    path: `${import.meta.env.BASE_URL}models/trial_2.vrm`,
    initialCameraPosition: { x: 0, y: 1.3, z: 2.4 },
    initialTarget: { x: 0, y: 1.3, z: 0 },
    frontPoseCameraPosition: { x: 0, y: 1.65, z: 2.1 },
    frontPoseTarget: { x: 0, y: 1.55, z: 0 },
    sceneRotationY: Math.PI,
    frontPoseSceneRotationY: 0
  }
];

const toVector3 = ({ x, y, z }) => new Vector3(x, y, z);

const disposeVrmScene = (vrm) => {
  if (!vrm?.scene) return;
  vrm.scene.traverse((object) => {
    if (!object.isMesh) {
      return;
    }

    object.geometry?.dispose?.();
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) {
          value.dispose?.();
        }
      });
      material.dispose?.();
    });
  });
};

const VrmStage = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const vrmRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelLoadTokenRef = useRef(0);
  const poseAnimationIdRef = useRef(null);
  const [status, setStatus] = useState('モデル読み込み中…');
  const [fps, setFps] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [activeExpressionKey, setActiveExpressionKey] = useState(null);
  const [selectedModelId, setSelectedModelId] = useState(MODEL_PRESETS[0].id);
  const fpsSampleRef = useRef({ last: performance.now(), count: 0 });
  const expressionAnimationIdRef = useRef(null);
  const expressionLoopActiveRef = useRef(false);
  const expressionOriginalPoseRef = useRef(null);
  const expressionBlinkRef = useRef({ lastBlink: 0, blinkStart: 0, blinking: false });
  const expressionNodRef = useRef({
    lastUpdate: 0,
    elapsed: 0,
    nextChange: 0,
    target: 0,
    current: 0
  });
  const activeExpressionKeyRef = useRef(null);
  const assistantBubbleAnimationIdRef = useRef(null);
  const assistantBubbleStateRef = useRef({
    active: false,
    mouthPhase: 0,
    currentWeight: 0,
    blink: { lastBlink: 0, blinkStart: 0, blinking: false },
    nod: {
      lastUpdate: 0,
      elapsed: 0,
      nextChange: 0,
      target: 0,
      current: 0
    },
    originalPose: null
  });
  const assistantBubbleTimeoutRef = useRef({ hide: null, clear: null });
  const assistantBubbleRafRef = useRef(null);
  const lastAssistantMessageIdRef = useRef(null);
  const [assistantBubbleText, setAssistantBubbleText] = useState('');
  const [assistantBubbleKey, setAssistantBubbleKey] = useState(0);
  const [isAssistantBubbleVisible, setIsAssistantBubbleVisible] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const selectedModelPreset =
    MODEL_PRESETS.find((preset) => preset.id === selectedModelId) ?? MODEL_PRESETS[0];
  const { started, messages } = useAppStore((state) => ({
    started: state.started,
    messages: state.messages
  }));

  const applyCameraPreset = useCallback((cameraPosition, controlTarget) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (!camera) {
      return;
    }

    camera.position.copy(toVector3(cameraPosition));
    if (controls) {
      controls.target.copy(toVector3(controlTarget));
      controls.update();
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const scene = new Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new PerspectiveCamera(
      35,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    cameraRef.current = camera;

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(new Color(0x000000), 0);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambient = new AmbientLight(0xffffff, 1);
    const directional = new DirectionalLight(0xffffff, 1.2);
    directional.position.set(1, 1.5, 1);
    scene.add(ambient);
    scene.add(directional);

    rendererRef.current = renderer;
    controlsRef.current = controls;
    applyCameraPreset(
      MODEL_PRESETS[0].initialCameraPosition,
      MODEL_PRESETS[0].initialTarget
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
      disposeVrmScene(vrmRef.current);
      vrmRef.current = null;
      renderer.domElement.remove();
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      if (poseAnimationIdRef.current !== null) {
        cancelAnimationFrame(poseAnimationIdRef.current);
      }
      poseAnimationIdRef.current = null;
      if (vrmRef.current?.expressionManager) {
        const manager = vrmRef.current.expressionManager;
        manager.setValue('blink', 0);
        manager.setValue('grip', 0);
        manager.setValue('angry', 0);
        manager.update();
      }
      if (expressionAnimationIdRef.current !== null) {
        cancelAnimationFrame(expressionAnimationIdRef.current);
      }
      expressionAnimationIdRef.current = null;
      expressionLoopActiveRef.current = false;
      expressionOriginalPoseRef.current = null;
      expressionBlinkRef.current = { lastBlink: 0, blinkStart: 0, blinking: false };
      expressionNodRef.current = {
        lastUpdate: 0,
        elapsed: 0,
        nextChange: 0,
        target: 0,
        current: 0
      };
      activeExpressionKeyRef.current = null;
    };
  }, [applyCameraPreset]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) {
      return undefined;
    }

    modelLoadTokenRef.current += 1;
    const loadToken = modelLoadTokenRef.current;
    const previousVrm = vrmRef.current;

    interruptAssistantBubble();
    stopExpressionMotion({ silent: true });
    if (poseAnimationIdRef.current !== null) {
      cancelAnimationFrame(poseAnimationIdRef.current);
      poseAnimationIdRef.current = null;
    }
    if (previousVrm?.scene) {
      scene.remove(previousVrm.scene);
      disposeVrmScene(previousVrm);
      vrmRef.current = null;
    }

    setModelReady(false);
    setStatus(`${selectedModelPreset.label} を読み込み中…`);
    setActiveExpressionKey(null);
    activeExpressionKeyRef.current = null;
    lastAssistantMessageIdRef.current = null;

    applyCameraPreset(
      selectedModelPreset.initialCameraPosition,
      selectedModelPreset.initialTarget
    );

    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser, { autoUpdateHumanBones: true }));

    loader.load(
      selectedModelPreset.path,
      async (gltf) => {
        if (loadToken !== modelLoadTokenRef.current) {
          return;
        }

        try {
          const vrm = gltf.userData.vrm;
          if (!vrm) {
            throw new Error('VRM データが見つかりませんでした。');
          }
          VRMUtils.removeUnnecessaryJoints(vrm.scene);
          vrm.scene.rotation.y = selectedModelPreset.sceneRotationY;
          scene.add(vrm.scene);
          vrmRef.current = vrm;
          setModelReady(true);
          setStatus(`${selectedModelPreset.label} の準備が完了しました`);
        } catch (error) {
          console.error(error);
          setModelReady(false);
          setStatus('VRM の読み込みに失敗しました。');
        }
      },
      undefined,
      (error) => {
        if (loadToken !== modelLoadTokenRef.current) {
          return;
        }
        console.error(error);
        setModelReady(false);
        setStatus('VRM の読み込みに失敗しました。');
      }
    );

    return () => {
      modelLoadTokenRef.current += 1;
    };
  }, [applyCameraPreset, selectedModelId]);

  useEffect(() => {
    activeExpressionKeyRef.current = activeExpressionKey;
  }, [activeExpressionKey]);

  const runExpressionLoop = useCallback(() => {
    if (expressionLoopActiveRef.current) return;
    if (!activeExpressionKeyRef.current) return;

    const vrm = vrmRef.current;
    if (!vrm || !vrm.humanoid || !vrm.expressionManager) {
      return;
    }

    const humanoid = vrm.humanoid;
    const neck = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Neck);
    if (neck) {
      expressionOriginalPoseRef.current = {
        [VRMHumanBoneName.Neck]: { rotation: neck.rotation.clone() }
      };
    } else {
      expressionOriginalPoseRef.current = null;
    }

    const startTime = performance.now();
    expressionBlinkRef.current = {
      lastBlink: startTime,
      blinkStart: 0,
      blinking: false
    };
    expressionNodRef.current = {
      lastUpdate: startTime,
      elapsed: 0,
      nextChange: 1 + Math.random() * 0.7,
      target: 0,
      current: 0
    };

    expressionLoopActiveRef.current = true;

    const loop = (now) => {
      if (!expressionLoopActiveRef.current || !activeExpressionKeyRef.current) {
        expressionAnimationIdRef.current = null;
        return;
      }
      const vrmInstance = vrmRef.current;
      if (!vrmInstance) {
        expressionLoopActiveRef.current = false;
        expressionAnimationIdRef.current = null;
        return;
      }

      const humanoidInstance = vrmInstance.humanoid;
      if (humanoidInstance && expressionOriginalPoseRef.current) {
        const neckBone = humanoidInstance.getNormalizedBoneNode(VRMHumanBoneName.Neck);
        if (neckBone) {
          const nodState = expressionNodRef.current;
          const deltaSeconds = nodState.lastUpdate
            ? (now - nodState.lastUpdate) / 1000
            : 0;
          nodState.lastUpdate = now;
          nodState.elapsed += deltaSeconds;
          const smoothing = Math.min(deltaSeconds * 3, 1);
          nodState.current += (nodState.target - nodState.current) * smoothing;
          if (nodState.elapsed >= nodState.nextChange) {
            nodState.elapsed = 0;
            nodState.nextChange = 1 + Math.random() * 0.8;
            const direction = Math.random() > 0.5 ? 1 : -1;
            const magnitude = MathUtils.degToRad(0.8 + Math.random() * 2);
            nodState.target = direction * magnitude;
          }
          const baseRotation =
            expressionOriginalPoseRef.current[VRMHumanBoneName.Neck]?.rotation;
          if (baseRotation) {
            neckBone.rotation.set(
              baseRotation.x + nodState.current,
              baseRotation.y,
              baseRotation.z
            );
            humanoidInstance.update();
          }
        }
      }

      const manager = vrmInstance.expressionManager;
      if (manager) {
        const blinkState = expressionBlinkRef.current;
        if (!blinkState.blinking && now - blinkState.lastBlink >= 3000) {
          blinkState.blinking = true;
          blinkState.blinkStart = now;
        }

        let blinkWeight = 0;
        if (blinkState.blinking) {
          const duration = 180;
          const progress = Math.min((now - blinkState.blinkStart) / duration, 1);
          blinkWeight = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
          if (progress >= 1) {
            blinkState.blinking = false;
            blinkState.lastBlink = now;
            blinkWeight = 0;
          }
        }

        manager.setValue('blink', blinkWeight);
        EXPRESSION_PRESETS.forEach(({ key }) => {
          // keyそれぞれで数値を変える
          let weight = 0.5;
          if (key == "happy") { weight = 0.8; }
          else if (key == "angry") { weight = 0.7; }
          manager.setValue(key, key === activeExpressionKeyRef.current ? weight : 0);
          

        });
        manager.update();
      }

      expressionAnimationIdRef.current = requestAnimationFrame(loop);
    };

    expressionAnimationIdRef.current = requestAnimationFrame(loop);
  }, []);

  const resumeExpressionIfSelected = useCallback(() => {
    if (activeExpressionKeyRef.current) {
      runExpressionLoop();
    }
  }, [runExpressionLoop]);

  const stopExpressionMotion = useCallback(
    (options = {}) => {
      const { silent = false, preserveSelection = false } = options;
      const vrm = vrmRef.current;

      if (expressionAnimationIdRef.current !== null) {
        cancelAnimationFrame(expressionAnimationIdRef.current);
        expressionAnimationIdRef.current = null;
      }
      expressionLoopActiveRef.current = false;

      if (vrm?.humanoid && expressionOriginalPoseRef.current) {
        Object.entries(expressionOriginalPoseRef.current).forEach(([boneName, pose]) => {
          const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
          if (bone && pose?.rotation) {
            bone.rotation.copy(pose.rotation);
          }
        });
        vrm.humanoid.update();
      }
      expressionOriginalPoseRef.current = null;

      expressionBlinkRef.current = { lastBlink: 0, blinkStart: 0, blinking: false };
      expressionNodRef.current = {
        lastUpdate: 0,
        elapsed: 0,
        nextChange: 0,
        target: 0,
        current: 0
      };

      if (!preserveSelection && activeExpressionKey !== null) {
        setActiveExpressionKey(null);
        activeExpressionKeyRef.current = null;
      }

      if (vrm?.expressionManager && !preserveSelection) {
        EXPRESSION_PRESETS.forEach(({ key }) => {
          vrm.expressionManager.setValue(key, 0);
        });
        vrm.expressionManager.setValue('blink', 0);
        vrm.expressionManager.update();
      }

      if (!silent && !preserveSelection) {
        setStatus('表情モーションを停止しました');
      }
    },
    [activeExpressionKey]
  );

  const clearAssistantBubbleTimers = useCallback(() => {
    const timers = assistantBubbleTimeoutRef.current;
    if (timers.hide) {
      clearTimeout(timers.hide);
      timers.hide = null;
    }
    if (timers.clear) {
      clearTimeout(timers.clear);
      timers.clear = null;
    }
  }, []);

  const stopAssistantBubbleMotion = useCallback(() => {
    const state = assistantBubbleStateRef.current;
    state.active = false;
    if (assistantBubbleAnimationIdRef.current !== null) {
      cancelAnimationFrame(assistantBubbleAnimationIdRef.current);
      assistantBubbleAnimationIdRef.current = null;
    }
    const vrm = vrmRef.current;
    if (vrm?.humanoid && state.originalPose) {
      Object.entries(state.originalPose).forEach(([boneName, pose]) => {
        const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
        if (bone && pose?.rotation) {
          bone.rotation.copy(pose.rotation);
        }
      });
      vrm.humanoid.update();
    }
    state.originalPose = null;
    state.currentWeight = 0;
    state.blink = { lastBlink: 0, blinkStart: 0, blinking: false };
    state.nod = {
      lastUpdate: 0,
      elapsed: 0,
      nextChange: 0,
      target: 0,
      current: 0
    };
  }, []);

  const interruptAssistantBubble = useCallback(() => {
    clearAssistantBubbleTimers();
    stopAssistantBubbleMotion();
    setIsAssistantBubbleVisible(false);
    setAssistantBubbleText('');
  }, [clearAssistantBubbleTimers, stopAssistantBubbleMotion]);

  const hideAssistantBubble = useCallback(() => {
    const timers = assistantBubbleTimeoutRef.current;
    if (timers.hide) {
      clearTimeout(timers.hide);
      timers.hide = null;
    }
    setIsAssistantBubbleVisible(false);
    if (timers.clear) {
      clearTimeout(timers.clear);
    }
    timers.clear = setTimeout(() => {
      setAssistantBubbleText('');
      stopAssistantBubbleMotion();
      if (activeExpressionKeyRef.current) {
        runExpressionLoop();
      }
      timers.clear = null;
    }, 350);
  }, [runExpressionLoop, stopAssistantBubbleMotion]);

  const startAssistantBubbleMotion = useCallback(() => {
    const vrm = vrmRef.current;
    if (!vrm) return;

    stopExpressionMotion({ silent: true, preserveSelection: true });

    const state = assistantBubbleStateRef.current;
    state.active = true;
    state.mouthPhase = Math.random() * Math.PI * 2;
    const now = performance.now();
    state.blink = { lastBlink: now, blinkStart: 0, blinking: false };
    state.nod = {
      lastUpdate: now,
      elapsed: 0,
      nextChange: 0.6 + Math.random() * 0.9,
      target: 0,
      current: 0
    };

    if (vrm.humanoid) {
      const neck = vrm.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Neck);
      state.originalPose = neck
        ? {
            [VRMHumanBoneName.Neck]: { rotation: neck.rotation.clone() }
          }
        : null;
    } else {
      state.originalPose = null;
    }

    const animate = (timestamp) => {
      const vrmInstance = vrmRef.current;
      if (!state.active || !vrmInstance) {
        assistantBubbleAnimationIdRef.current = null;
        return;
      }

      const t = timestamp / 1000;
      state.currentWeight = 0.1 + 0.3 * Math.sin(t * 6 + state.mouthPhase);
      if (state.currentWeight < 0) {
        state.currentWeight = 0;
      }

      if (vrmInstance.humanoid && state.originalPose) {
        const neckBone = vrmInstance.humanoid.getNormalizedBoneNode(VRMHumanBoneName.Neck);
        if (neckBone) {
          const nodState = state.nod;
          const deltaSeconds = nodState.lastUpdate
            ? (timestamp - nodState.lastUpdate) / 1000
            : 0;
          nodState.lastUpdate = timestamp;
          nodState.elapsed += deltaSeconds;
          const smoothing = Math.min(deltaSeconds * 5, 1);
          nodState.current += (nodState.target - nodState.current) * smoothing;
          if (nodState.elapsed >= nodState.nextChange) {
            nodState.elapsed = 0;
            nodState.nextChange = 0.6 + Math.random() * 0.9;
            const direction = Math.random() > 0.5 ? 1 : -1;
            const magnitude = MathUtils.degToRad(0.7 + Math.random() * 1.2);
            nodState.target = direction * magnitude;
          }
          const baseRotation = state.originalPose[VRMHumanBoneName.Neck]?.rotation;
          if (baseRotation) {
            neckBone.rotation.set(
              baseRotation.x + nodState.current,
              baseRotation.y,
              baseRotation.z
            );
            vrmInstance.humanoid.update();
          }
        }
      }

      const manager = vrmInstance.expressionManager;
      if (manager) {
        const blinkState = state.blink;
        if (!blinkState.blinking && timestamp - blinkState.lastBlink >= 3000) {
          blinkState.blinking = true;
          blinkState.blinkStart = timestamp;
        }
        let blinkWeight = 0;
        if (blinkState.blinking) {
          const duration = 160;
          const progress = Math.min((timestamp - blinkState.blinkStart) / duration, 1);
          blinkWeight = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
          if (progress >= 1) {
            blinkState.blinking = false;
            blinkState.lastBlink = timestamp;
            blinkWeight = 0;
          }
        }

        manager.setValue('blink', blinkWeight);
        const selectedKey = activeExpressionKeyRef.current;
        EXPRESSION_PRESETS.forEach(({ key }) => {
          if (key === 'surprised') {
            const selectedWeight = selectedKey === 'surprised' ? 0.5 : 0;
            const bubbleWeight =
              selectedKey === 'surprised'
                ? state.currentWeight
                : Math.max(state.currentWeight, selectedWeight);
            manager.setValue(key, bubbleWeight);
          } else {
            manager.setValue(key, key === selectedKey ? 0.5 : 0);
          }
        });
        manager.update();
      }

      assistantBubbleAnimationIdRef.current = requestAnimationFrame(animate);
    };

    if (assistantBubbleAnimationIdRef.current !== null) {
      cancelAnimationFrame(assistantBubbleAnimationIdRef.current);
    }
    assistantBubbleAnimationIdRef.current = requestAnimationFrame(animate);
  }, [stopExpressionMotion]);

  const triggerAssistantBubble = useCallback(
    (text) => {
      const trimmed = (text || '').trim();
      if (!trimmed) return;

      clearAssistantBubbleTimers();
      stopAssistantBubbleMotion();

      const limit = 90;
      const truncated = trimmed.length > limit ? `${trimmed.slice(0, limit)}...` : trimmed;
      if (assistantBubbleRafRef.current !== null) {
        cancelAnimationFrame(assistantBubbleRafRef.current);
        assistantBubbleRafRef.current = null;
      }
      setIsAssistantBubbleVisible(false);
      setAssistantBubbleText(truncated);
      setAssistantBubbleKey((prev) => prev + 1);
      assistantBubbleRafRef.current = requestAnimationFrame(() => {
        setIsAssistantBubbleVisible(true);
        assistantBubbleRafRef.current = null;
      });
      startAssistantBubbleMotion();

      const timers = assistantBubbleTimeoutRef.current;
      timers.hide = setTimeout(() => {
        hideAssistantBubble();
      }, 5000);
    },
    [
      clearAssistantBubbleTimers,
      hideAssistantBubble,
      startAssistantBubbleMotion,
      stopAssistantBubbleMotion
    ]
  );

  const handleExpressionButtonClick = useCallback(
    (preset) => {
      if (!modelReady) return;
      if (activeExpressionKey === preset.key) {
        stopExpressionMotion();
        return;
      }
      interruptAssistantBubble();
      stopExpressionMotion({ silent: true });
      setActiveExpressionKey(preset.key);
      activeExpressionKeyRef.current = preset.key;
      setStatus(`${preset.label} の表情モーションを開始しました`);
      runExpressionLoop();
    },
    [
      activeExpressionKey,
      interruptAssistantBubble,
      modelReady,
      runExpressionLoop,
      setStatus,
      stopExpressionMotion
    ]
  );

  const applyFrontPose = useCallback(() => {
    const vrm = vrmRef.current;
    if (!vrm) {
      return;
    }

    interruptAssistantBubble();
    stopExpressionMotion({ silent: true, preserveSelection: true });

    if (poseAnimationIdRef.current !== null) {
      cancelAnimationFrame(poseAnimationIdRef.current);
      poseAnimationIdRef.current = null;
    }

    const humanoid = vrm.humanoid;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    vrm.scene.rotation.y = selectedModelPreset.frontPoseSceneRotationY;

    if (humanoid) {
      const setBoneEuler = (boneName, { x = 0, y = 0, z = 0 }) => {
        const bone = humanoid.getNormalizedBoneNode(boneName);
        if (bone) {
          bone.rotation.set(x, y, z);
        }
      };

      setBoneEuler(VRMHumanBoneName.LeftUpperArm, {
        x: MathUtils.degToRad(-10),
        y: MathUtils.degToRad(12),
        z: MathUtils.degToRad(-75)
      });
      setBoneEuler(VRMHumanBoneName.LeftLowerArm, {
        x: MathUtils.degToRad(-5),
        y: MathUtils.degToRad(8),
        z: MathUtils.degToRad(-5)
      });
      setBoneEuler(VRMHumanBoneName.RightUpperArm, {
        x: MathUtils.degToRad(-10),
        y: MathUtils.degToRad(-12),
        z: MathUtils.degToRad(75)
      });
      setBoneEuler(VRMHumanBoneName.RightLowerArm, {
        x: MathUtils.degToRad(-5),
        y: MathUtils.degToRad(-8),
        z: MathUtils.degToRad(5)
      });

      const neck = humanoid.getNormalizedBoneNode(VRMHumanBoneName.Neck);
      if (neck) {
        neck.rotation.set(MathUtils.degToRad(-5), 0, 0);
      }

      humanoid.update();
    }

    const targetCameraPos = toVector3(selectedModelPreset.frontPoseCameraPosition);
    const targetControlTarget = toVector3(selectedModelPreset.frontPoseTarget);
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    if (camera) {
      const startCameraPos = camera.position.clone();
      const startTime = performance.now();
      const duration = 850;
      const startControlTarget = controls ? controls.target.clone() : null;
      const tempTarget = new Vector3();
      setStatus('正面ポジションへ移動中…');

      const animate = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(t);

        camera.position.lerpVectors(startCameraPos, targetCameraPos, eased);

        if (controls) {
          if (startControlTarget) {
            tempTarget.copy(startControlTarget).lerp(targetControlTarget, eased);
            controls.target.copy(tempTarget);
          } else {
            controls.target.copy(targetControlTarget);
          }
          controls.update();
        }

        if (t < 1) {
          poseAnimationIdRef.current = requestAnimationFrame(animate);
        } else {
          camera.position.copy(targetCameraPos);
          if (controls) {
            controls.target.copy(targetControlTarget);
            controls.update();
          }
          poseAnimationIdRef.current = null;
          setStatus('正面ポジションを適用しました');
          resumeExpressionIfSelected();
        }
      };

      poseAnimationIdRef.current = requestAnimationFrame(animate);
    } else {
      if (controls) {
        controls.target.copy(targetControlTarget);
        controls.update();
      }
      setStatus('正面ポジションを適用しました');
      resumeExpressionIfSelected();
    }
  }, [
    interruptAssistantBubble,
    resumeExpressionIfSelected,
    selectedModelPreset,
    stopExpressionMotion
  ]);

  useEffect(() => {
    if (started && modelReady) {
      applyFrontPose();
    }
  }, [started, modelReady, applyFrontPose]);

  useEffect(() => {
    if (!messages.length) return;
    const latest = messages[messages.length - 1];
    if (!latest || latest.role === 'user') return;
    if (lastAssistantMessageIdRef.current === latest.id) return;
    lastAssistantMessageIdRef.current = latest.id;
    triggerAssistantBubble(latest.text || '');
  }, [messages, triggerAssistantBubble]);

  useEffect(
    () => () => {
      clearAssistantBubbleTimers();
      stopAssistantBubbleMotion();
      if (assistantBubbleRafRef.current !== null) {
        cancelAnimationFrame(assistantBubbleRafRef.current);
        assistantBubbleRafRef.current = null;
      }
    },
    [clearAssistantBubbleTimers, stopAssistantBubbleMotion]
  );

  const assistantBubbleBg = useColorModeValue('whiteAlpha.900', 'blackAlpha.700');
  const assistantBubbleBorder = useColorModeValue('blue.200', 'blue.500');
  const assistantBubbleTextColor = useColorModeValue('gray.700', 'gray.100');
  const assistantBubbleLabelBg = useColorModeValue('blue.500', 'blue.300');
  const assistantBubbleLabelColor = useColorModeValue('white', 'gray.900');
  const assistantBubbleTransform =
    isAssistantBubbleVisible && assistantBubbleText
      ? 'translate(-50%, 0)'
      : 'translate(-50%, 16px)';
  const assistantBubblePointerOpacity =
    isAssistantBubbleVisible && assistantBubbleText ? 1 : 0;
  const selectedBackground =
    BACKGROUND_PRESETS[backgroundIndex % BACKGROUND_PRESETS.length];
  const backgroundSrc = useBreakpointValue(selectedBackground.sources);
  const resolvedBackgroundSrc = backgroundSrc || selectedBackground.sources.base;
  const handleCycleModel = () => {
    const currentIndex = MODEL_PRESETS.findIndex((preset) => preset.id === selectedModelId);
    const nextIndex = (currentIndex + 1) % MODEL_PRESETS.length;
    setSelectedModelId(MODEL_PRESETS[nextIndex].id);
  };

  return (
    <Stack spacing={4} height="100%" role="region" aria-label="VRM ステージ">
      <Box position="relative" borderRadius="lg" overflow="hidden" flex="1">
        <Box position="absolute" inset="0" zIndex={0} pointerEvents="none">
          <Image
            src={resolvedBackgroundSrc}
            alt="ロールプレイの舞台となる学校の背景"
            width="100%"
            height="100%"
            objectFit="cover"
          />
          <Box
            position="absolute"
            inset="0"
            bgGradient="linear(to-b, blackAlpha.400 0%, blackAlpha.100 40%, blackAlpha.500 100%)"
          />
        </Box>
        <Box
          ref={containerRef}
          height="100%"
          minH="320px"
          aria-label="3D モデルビューア"
          position="relative"
          zIndex={1}
          background="transparent"
        />
        <Badge position="absolute" top={4} left={4} colorScheme="blue">
          {status}
        </Badge>
        <Badge position="absolute" top={4} right={4} colorScheme="purple">
          FPS: {fps}
        </Badge>
        <IconButton
          icon={<ViewIcon />}
          aria-label={`3D モデルを切り替える（現在: ${selectedModelPreset.label}）`}
          size="sm"
          position="absolute"
          bottom={4}
          left={4}
          colorScheme="blackAlpha"
          variant="solid"
          bg="blackAlpha.600"
          _hover={{ bg: 'blackAlpha.700' }}
          _active={{ bg: 'blackAlpha.800' }}
          zIndex={3}
          onClick={handleCycleModel}
        />
        <IconButton
          icon={<RepeatIcon />}
          aria-label={`背景を切り替える（現在: ${selectedBackground.label}）`}
          size="sm"
          position="absolute"
          bottom={4}
          right={4}
          colorScheme="blackAlpha"
          variant="solid"
          bg="blackAlpha.600"
          _hover={{ bg: 'blackAlpha.700' }}
          _active={{ bg: 'blackAlpha.800' }}
          zIndex={3}
          onClick={() =>
            setBackgroundIndex((prev) => (prev + 1) % BACKGROUND_PRESETS.length)
          }
        />
        <Box
          key={assistantBubbleKey}
          position="absolute"
          left="50%"
          bottom={{ base: 3, md: 6 }}
          px={3}
          py={2}
          borderRadius="lg"
          boxShadow="lg"
          bg={assistantBubbleBg}
          borderWidth="1px"
          borderColor={assistantBubbleBorder}
          opacity={isAssistantBubbleVisible && assistantBubbleText ? 1 : 0}
          transform={assistantBubbleTransform}
          transition="opacity 0.35s ease, transform 0.35s ease"
          pointerEvents="none"
          zIndex={2}
          maxW="95%"
          visibility={assistantBubbleText ? 'visible' : 'hidden'}
          fontSize="xs"
          color={assistantBubbleTextColor}
          textAlign="center"
          _before={{
            content: "''",
            position: 'absolute',
            top: '-19px',
            left: '70%',
            width: '8px',
            height: '23px',
            bg: assistantBubbleBorder,
            borderRadius: 'full',
            transform: 'translateX(-50%) rotate(-14deg)',
            transformOrigin: 'bottom center',
            opacity: assistantBubblePointerOpacity,
            transition: 'opacity 0.35s ease',
            // boxShadow: '0 0 4px rgba(0,0,0,0.15)'
          }}
          _after={{
            content: "''",
            position: 'absolute',
            top: '-14px',
            left: '70%',
            width: '6px',
            height: '18px',
            bg: assistantBubbleBg,
            borderRadius: 'full',
            transform: 'translateX(-50%) rotate(-14deg)',
            transformOrigin: 'bottom center',
            opacity: assistantBubblePointerOpacity,
            transition: 'opacity 0.35s ease'
          }}
        >
          <Stack spacing={1} align="center">
            <Box
              px={2.5}
              py={0.5}
              borderRadius="full"
              bg={assistantBubbleLabelBg}
              color={assistantBubbleLabelColor}
              fontSize="xs"
              fontWeight="semibold"
              boxShadow="sm"
              textTransform="none"
              letterSpacing="0.02em"
            >
              ロールプレイ相手
            </Box>
            <Text noOfLines={3} lineHeight="1.3">
              {assistantBubbleText}
            </Text>
          </Stack>
        </Box>
      </Box>
      <Stack spacing={0}>
        {!modelReady && (
          <Text fontSize="xs" color="gray.400">
            モデルの読み込みが完了すると操作できます。
          </Text>
        )}
        <Button
          size="sm"
          colorScheme="blue"
          onClick={applyFrontPose}
          isDisabled={!modelReady}
          aria-label="モデルを正面ポジションに調整する「正面を向く」"
          alignSelf="stretch"
          mt="4"
          mb="4"
        >
          正面を向く
        </Button>
        <Stack
          direction="row"
          spacing="2"
          flexWrap="wrap"
          mt="1"
          aria-label="表情プリセット"
        >
          {EXPRESSION_PRESETS.map((preset) => (
            <Button
              key={preset.key}
              size="xs"
              flex="1"
              colorScheme="pink"
              variant={activeExpressionKey === preset.key ? 'solid' : 'outline'}
              onClick={() => handleExpressionButtonClick(preset)}
              isDisabled={!modelReady}
              aria-pressed={activeExpressionKey === preset.key}
              aria-label={`${preset.description} 表情モーションを切り替える`}
            >
              {preset.label}
            </Button>
          ))}
        </Stack>
      </Stack>
      <ChatComposer
        inputId="vrm-chat-input"
        display={{ base: 'flex', md: 'none' }}
        w="100%"
      />
    </Stack>
  );
};

export default VrmStage;
