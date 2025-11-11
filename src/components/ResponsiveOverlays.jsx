import {
  Box,
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
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <>
      {isMobile && (
        <>
          <IconButton
            aria-label={isScenarioOpen ? 'シナリオを閉じる' : 'シナリオを開く'}
            icon={<HamburgerIcon />}
            display={{ base: '', md: !isScenarioOpen ? 'none' : '' }}
            position="fixed"
            top={4}
            left={4}
            zIndex="popover"
            colorScheme="blue"
            onClick={isScenarioOpen ? onCloseScenario : onOpenScenario}
          />
          <Drawer
            isOpen={isScenarioOpen}
            placement="left"
            onClose={onCloseScenario}
            size="full"
          >
            <DrawerOverlay />
            <DrawerContent display="flex" flexDirection="column">
              <DrawerHeader borderBottomWidth="1px">シナリオ</DrawerHeader>
              <DrawerBody
                display="flex"
                flexDirection="column"
                overflow="hidden"
                px={0}
                pt={0}
              >
                <Box flex="1" overflowY="auto" px={4} py={4}>
                  {scenarioContent}
                </Box>
              </DrawerBody>
            </DrawerContent>
          </Drawer>

          <IconButton
            aria-label={isChatOpen ? 'チャットを閉じる' : 'チャットを開く'}
            icon={<ChatIcon />}
            display={{ base: '', md: !isChatOpen ? 'none' : '' }}
            position="fixed"
            top={4}
            left={16}
            zIndex="popover"
            colorScheme="pink"
            onClick={isChatOpen ? onCloseChat : onOpenChat}
          />
          <Drawer
            isOpen={isChatOpen}
            placement="left"
            onClose={onCloseChat}
            size="full"
          >
            <DrawerOverlay />
            <DrawerContent display="flex" flexDirection="column">
              <DrawerHeader borderBottomWidth="1px">チャット</DrawerHeader>
              <DrawerBody
                display="flex"
                flexDirection="column"
                overflow="hidden"
                px={0}
                pt={0}
              >
                <Box flex="1" overflowY="auto" px={4} py={4}>
                  {chatContent}
                </Box>
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
      )}

      <Button
        aria-label="トレーニング終了"
        leftIcon={<UnlockIcon />}
        colorScheme="green"
        position="fixed"
        bottom={{
          base: 'calc(var(--chakra-space-4) + env(safe-area-inset-bottom, 0px))',
          md: 'var(--chakra-space-6)'
        }}
        left={{ base: 4, md: 6 }}
        zIndex="popover"
        onClick={onRequestTrainingEnd}
        // isDisabled={!canEndTraining}
        display={canEndTraining ? '' : 'none'}
      >
        トレーニング終了
      </Button>
    </>
  );
};

export default ResponsiveOverlays;
