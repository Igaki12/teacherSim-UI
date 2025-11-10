import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Container,
  Grid,
  GridItem,
  useColorModeValue,
  useDisclosure
} from '@chakra-ui/react';
import { useRef } from 'react';
import AppHeader from './components/AppHeader.jsx';
import AppFooter from './components/AppFooter.jsx';
import AuthDummy from './components/AuthDummy.jsx';
import SidebarScenario from './components/SidebarScenario.jsx';
import VrmStage from './components/VrmStage.jsx';
import ChatPanel from './components/ChatPanel.jsx';
import TutorialDrawer from './components/TutorialDrawer.jsx';
import ResponsiveOverlays from './components/ResponsiveOverlays.jsx';
import ProgressDashboard from './components/ProgressDashboard.jsx';
import useAppStore from './store/useAppStore.js';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button
} from '@chakra-ui/react';

const App = () => {
  const {
    isAuthenticated,
    started,
    trainingEnded,
    endTraining,
    scores
  } = useAppStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    started: state.started,
    trainingEnded: state.trainingEnded,
    endTraining: state.endTraining,
    scores: state.scores
  }));

  const scenarioDrawer = useDisclosure();
  const chatDrawer = useDisclosure();
  const endDialog = useDisclosure();
  const cancelRef = useRef();

  const canEndTraining = started && !trainingEnded;

  const handleConfirmEnd = () => {
    endTraining();
    endDialog.onClose();
  };

  const mainBg = useColorModeValue('gray.100', 'gray.900');

  return (
    <Box bg={mainBg} minH="100vh" display="flex" flexDirection="column">
      <AppHeader />
      <Box as="main" flex="1" py={{ base: 6, md: 10 }}>
        <Container maxW="7xl">
          <AuthDummy />
          {!isAuthenticated ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>ログインが必要です</AlertTitle>
                <AlertDescription>
                  上記ダミー認証フォームからログインすると UI を操作できるようになります。
                </AlertDescription>
              </Box>
            </Alert>
          ) : (
            <>
              <Grid
                templateColumns={{
                  base: '1fr',
                  md: '260px minmax(0, 1fr) 320px',
                  lg: '280px minmax(0, 1fr) 420px'
                }}
                gap={{ base: 4, md: 6 }}
                alignItems="start"
              >
                <GridItem display={{ base: 'none', md: 'block' }}>
                  <SidebarScenario />
                </GridItem>
                <GridItem>
                  <VrmStage />
                </GridItem>
                <GridItem display={{ base: 'none', md: 'block' }}>
                  <ChatPanel />
                </GridItem>
              </Grid>
              <Box mt={6}>
                <ProgressDashboard scores={scores} isVisible={trainingEnded} />
              </Box>
            </>
          )}
        </Container>
      </Box>
      <AppFooter />

      <TutorialDrawer isVisible={isAuthenticated} />

      {isAuthenticated && (
        <ResponsiveOverlays
          scenarioContent={<SidebarScenario onClose={scenarioDrawer.onClose} />}
          chatContent={<ChatPanel />}
          isScenarioOpen={scenarioDrawer.isOpen}
          onOpenScenario={scenarioDrawer.onOpen}
          onCloseScenario={scenarioDrawer.onClose}
          isChatOpen={chatDrawer.isOpen}
          onOpenChat={chatDrawer.onOpen}
          onCloseChat={chatDrawer.onClose}
          onRequestTrainingEnd={endDialog.onOpen}
          canEndTraining={canEndTraining}
        />
      )}

      <AlertDialog
        isOpen={endDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={endDialog.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              採点を実行しますか？
            </AlertDialogHeader>
            <AlertDialogBody>
              「これで採点してもよろしいですか？」 今回のセッションを終了し、採点サマリーとダッシュボードを表示します。
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={endDialog.onClose}>
                いいえ
              </Button>
              <Button colorScheme="green" onClick={handleConfirmEnd} ml={3}>
                はい
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default App;
