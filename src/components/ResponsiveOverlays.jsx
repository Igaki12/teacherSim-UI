import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  useBreakpointValue
} from '@chakra-ui/react';
import { ChatIcon, HamburgerIcon, UnlockIcon } from '@chakra-ui/icons';

const ResponsiveOverlays = ({
  scenarioContent,
  chatContent,
  isScenarioOpen,
  onOpenScenario,
  onCloseScenario,
  isChatOpen,
  onOpenChat,
  onCloseChat,
  onRequestTrainingEnd,
  canEndTraining
}) => {
  const mobileDisplay = useBreakpointValue({ base: 'inline-flex', md: 'none' });

  return (
    <>
      <IconButton
        aria-label="シナリオを開く"
        icon={<HamburgerIcon />}
        position="fixed"
        top={4}
        left={4}
        display={mobileDisplay}
        zIndex="popover"
        colorScheme="blue"
        onClick={onOpenScenario}
      />
      <Drawer
        isOpen={isScenarioOpen}
        placement="left"
        onClose={onCloseScenario}
        size="full"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">シナリオ</DrawerHeader>
          <DrawerBody>{scenarioContent}</DrawerBody>
        </DrawerContent>
      </Drawer>

      <IconButton
        aria-label="チャットを開く"
        icon={<ChatIcon />}
        position="fixed"
        top={4}
        right={16}
        display={mobileDisplay}
        zIndex="popover"
        colorScheme="pink"
        onClick={onOpenChat}
      />
      <Drawer
        isOpen={isChatOpen}
        placement="right"
        onClose={onCloseChat}
        size="full"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">チャット</DrawerHeader>
          <DrawerBody>{chatContent}</DrawerBody>
        </DrawerContent>
      </Drawer>

      <Button
        aria-label="トレーニング終了"
        leftIcon={<UnlockIcon />}
        colorScheme="green"
        position="fixed"
        bottom={{ base: 4, md: 6 }}
        left={{ base: 4, md: 6 }}
        zIndex="popover"
        onClick={onRequestTrainingEnd}
        isDisabled={!canEndTraining}
      >
        トレーニング終了
      </Button>
    </>
  );
};

export default ResponsiveOverlays;
