import { Badge, Box, Button, Stack, Text } from '@chakra-ui/react';
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

const DEFAULT_MODEL_PATH = `${import.meta.env.BASE_URL}models/sample.vrm`;

const VrmStage = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const vrmRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const poseAnimationIdRef = useRef(null);
  const speechMotionIdRef = useRef(null);
  const speechMotionOriginalPoseRef = useRef(null);
  const speechMotionStartTimeRef = useRef(0);
  const speechMotionBlinkRef = useRef({ lastBlink: 0, blinkStart: 0, blinking: false });
  const speechMotionActiveRef = useRef(false);
  const [status, setStatus] = useState('モデル読み込み中…');
  const [fps, setFps] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [isSpeechMotionActive, setIsSpeechMotionActive] = useState(false);
  const fpsSampleRef = useRef({ last: performance.now(), count: 0 });
  const started = useAppStore((state) => state.started);

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
    cameraRef.current = camera;

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
          vrm.scene.rotation.y = Math.PI;
          scene.add(vrm.scene);
          vrmRef.current = vrm;
          setModelReady(true);
          setStatus('モデル準備完了');
        } catch (error) {
          console.error(error);
          setModelReady(false);
          setStatus('VRM の読み込みに失敗しました。');
        }
      },
      undefined,
      (error) => {
        console.error(error);
        setModelReady(false);
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
      cameraRef.current = null;
      controlsRef.current = null;
      if (poseAnimationIdRef.current !== null) {
        cancelAnimationFrame(poseAnimationIdRef.current);
      }
      poseAnimationIdRef.current = null;
      if (speechMotionIdRef.current !== null) {
        cancelAnimationFrame(speechMotionIdRef.current);
      }
      speechMotionIdRef.current = null;
      speechMotionActiveRef.current = false;
      if (vrmRef.current?.humanoid && speechMotionOriginalPoseRef.current) {
        const humanoid = vrmRef.current.humanoid;
        Object.entries(speechMotionOriginalPoseRef.current).forEach(([boneName, pose]) => {
          const bone = humanoid.getNormalizedBoneNode(boneName);
          if (bone && pose?.rotation) {
            bone.rotation.copy(pose.rotation);
          }
        });
        humanoid.update();
      }
      if (vrmRef.current?.expressionManager) {
        vrmRef.current.expressionManager.setValue('blink', 0);
        vrmRef.current.expressionManager.update();
      }
      speechMotionOriginalPoseRef.current = null;
      speechMotionBlinkRef.current = { lastBlink: 0, blinkStart: 0, blinking: false };
      speechMotionStartTimeRef.current = 0;
    };
  }, []);

  const stopSpeechMotion = useCallback(
    (options = {}) => {
      const vrm = vrmRef.current;
      if (!vrm) {
        speechMotionActiveRef.current = false;
        speechMotionIdRef.current = null;
        return;
      }

      if (speechMotionIdRef.current !== null) {
        cancelAnimationFrame(speechMotionIdRef.current);
        speechMotionIdRef.current = null;
      }

      const humanoid = vrm.humanoid;
      if (humanoid && speechMotionOriginalPoseRef.current) {
        Object.entries(speechMotionOriginalPoseRef.current).forEach(([boneName, pose]) => {
          const bone = humanoid.getNormalizedBoneNode(boneName);
          if (bone && pose?.rotation) {
            bone.rotation.copy(pose.rotation);
          }
        });
        humanoid.update();
      }

      if (vrm.expressionManager) {
        vrm.expressionManager.setValue('blink', 0);
        vrm.expressionManager.update();
      }

      speechMotionOriginalPoseRef.current = null;
      speechMotionBlinkRef.current = { lastBlink: 0, blinkStart: 0, blinking: false };
      speechMotionStartTimeRef.current = 0;
      speechMotionActiveRef.current = false;

      if (isSpeechMotionActive) {
        setIsSpeechMotionActive(false);
      }
      if (!options.silent) {
        setStatus('モーションを停止しました');
      }
    },
    [isSpeechMotionActive]
  );

  const startSpeechMotion = useCallback(() => {
    const vrm = vrmRef.current;
    if (!vrm || !vrm.humanoid) {
      return;
    }

    stopSpeechMotion({ silent: true });

    const humanoid = vrm.humanoid;
    const boneNames = [
      VRMHumanBoneName.LeftUpperArm,
      VRMHumanBoneName.LeftLowerArm,
      VRMHumanBoneName.RightUpperArm,
      VRMHumanBoneName.RightLowerArm,
      VRMHumanBoneName.Chest,
      VRMHumanBoneName.Spine,
      VRMHumanBoneName.UpperChest,
      VRMHumanBoneName.Neck
    ];

    const originalPose = {};
    const boneMap = {};
    boneNames.forEach((name) => {
      const bone = humanoid.getNormalizedBoneNode(name);
      if (bone) {
        originalPose[name] = { rotation: bone.rotation.clone() };
        boneMap[name] = bone;
      }
    });

    speechMotionOriginalPoseRef.current = originalPose;
    speechMotionStartTimeRef.current = performance.now();
    speechMotionBlinkRef.current = {
      lastBlink: speechMotionStartTimeRef.current,
      blinkStart: 0,
      blinking: false
    };
    speechMotionActiveRef.current = true;
    setIsSpeechMotionActive(true);
    setStatus('喋るモーション1 再生中');

    const setRotation = (boneName, { x = 0, y = 0, z = 0 }) => {
      const target = boneMap[boneName];
      if (target) {
        target.rotation.set(x, y, z);
      }
    };

    const animationLoop = (now) => {
      if (!speechMotionActiveRef.current) {
        return;
      }

      const elapsed = (now - speechMotionStartTimeRef.current) / 4000;
      const swayPhase = elapsed * Math.PI * 1.1;
      const sway = Math.sin(swayPhase) * MathUtils.degToRad(10);
      const counterSway = Math.sin(swayPhase + Math.PI / 2) * MathUtils.degToRad(6);
      const armLift = Math.sin(swayPhase * 0.8) * MathUtils.degToRad(8);

      setRotation(VRMHumanBoneName.Chest, {
        x: MathUtils.degToRad(14),
        y: counterSway * 0.1,
        z: sway * 0.1
      });

      setRotation(VRMHumanBoneName.UpperChest, {
        x: MathUtils.degToRad(-16),
        y: counterSway * 0.1,
        z: sway * 0.2
      });

      setRotation(VRMHumanBoneName.Spine, {
        x: MathUtils.degToRad(4),
        y: counterSway * -0.1,
        z: sway * -0.1
      });

      setRotation(VRMHumanBoneName.LeftUpperArm, {
        x: MathUtils.degToRad(-35) + armLift,
        y: MathUtils.degToRad(28),
        z: MathUtils.degToRad(-50) - sway * 0.8
      });

      setRotation(VRMHumanBoneName.LeftLowerArm, {
        x: MathUtils.degToRad(10) + armLift * 0.5,
        y: MathUtils.degToRad(15),
        z: MathUtils.degToRad(-12)
      });

      setRotation(VRMHumanBoneName.RightUpperArm, {
        x: MathUtils.degToRad(-35) - armLift,
        y: MathUtils.degToRad(-28),
        z: MathUtils.degToRad(50) + sway * 0.8
      });

      setRotation(VRMHumanBoneName.RightLowerArm, {
        x: MathUtils.degToRad(-10) - armLift * 0.5,
        y: MathUtils.degToRad(-15),
        z: MathUtils.degToRad(12)
      });

      setRotation(VRMHumanBoneName.Neck, {
        x: MathUtils.degToRad(4) + Math.sin(swayPhase * 0.9) * MathUtils.degToRad(2),
        y: counterSway * -0.3,
        z: -sway * 0.4
      });

      humanoid.update();

      if (vrm.expressionManager) {
        const blinkData = speechMotionBlinkRef.current;
        if (!blinkData.blinking && now - blinkData.lastBlink >= 3000) {
          blinkData.blinking = true;
          blinkData.blinkStart = now;
        }

        let blinkWeight = 0;
        if (blinkData.blinking) {
          const duration = 180;
          const progress = Math.min((now - blinkData.blinkStart) / duration, 1);
          blinkWeight = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
          if (progress >= 1) {
            blinkData.blinking = false;
            blinkData.lastBlink = now;
            blinkWeight = 0;
          }
        }

        vrm.expressionManager.setValue('blink', blinkWeight);
        vrm.expressionManager.update();
      }

      if (speechMotionActiveRef.current) {
        speechMotionIdRef.current = requestAnimationFrame(animationLoop);
      } else {
        speechMotionIdRef.current = null;
      }
    };

    if (speechMotionActiveRef.current) {
      speechMotionIdRef.current = requestAnimationFrame(animationLoop);
    }
  }, [stopSpeechMotion]);

  const applyFrontPose = useCallback(() => {
    const vrm = vrmRef.current;
    if (!vrm) {
      return;
    }

    stopSpeechMotion({ silent: true });

    if (poseAnimationIdRef.current !== null) {
      cancelAnimationFrame(poseAnimationIdRef.current);
      poseAnimationIdRef.current = null;
    }

    const humanoid = vrm.humanoid;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    vrm.scene.rotation.y = 0;

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

    const targetCameraPos = new Vector3(0, 1.45, 1.1);
    const targetControlTarget = new Vector3(0, 1.45, 0);
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
        }
      };

      poseAnimationIdRef.current = requestAnimationFrame(animate);
    } else {
      if (controls) {
        controls.target.copy(targetControlTarget);
        controls.update();
      }
      setStatus('正面ポジションを適用しました');
    }
  }, [stopSpeechMotion]);

  useEffect(() => {
    if (started && modelReady) {
      applyFrontPose();
    }
  }, [started, modelReady, applyFrontPose]);

  return (
    <Stack spacing={4} height="100%" role="region" aria-label="VRM ステージ">
      <Box position="relative" borderRadius="lg" overflow="hidden" flex="1">
        <Box
          ref={containerRef}
          height="100%"
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
          mt={{ base: 0, md: 4 }}
          mb={{ base: 0, md: 4 }}
        >
          正面を向く
        </Button>
        <Button
          size="sm"
          colorScheme="purple"
          variant={isSpeechMotionActive ? 'solid' : 'outline'}
          onClick={() => {
            if (!modelReady) return;
            if (isSpeechMotionActive) {
              stopSpeechMotion();
            } else {
              startSpeechMotion();
            }
          }}
          isDisabled={!modelReady}
          aria-label="喋るモーション1を開始または停止する"
          aria-pressed={isSpeechMotionActive}
          alignSelf="stretch"
          mb={{ base: 0, md: 4 }}
        >
          喋るモーション1
        </Button>
      </Stack>
      <ChatComposer
        inputId="vrm-chat-input"
        display={{ base: 'flex', md: 'none' }}
        w="100%"
        mb={{ base: '10vh', md: 0 }}
      />
    </Stack>
  );
};

export default VrmStage;
