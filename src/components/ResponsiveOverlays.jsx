import {
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  useBreakpointValue
} from '@chakra-ui/react';
import { ChatIcon, HamburgerIcon } from '@chakra-ui/icons';

const ResponsiveOverlays = ({
  scenarioContent,
  chatContent,
  isScenarioOpen,
  onOpenScenario,
  onCloseScenario,
  isChatOpen,
  onOpenChat,
  onCloseChat
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
    </>
  );
};

export default ResponsiveOverlays;
