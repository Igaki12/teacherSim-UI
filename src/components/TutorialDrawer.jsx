import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  IconButton,
  List,
  ListIcon,
  ListItem,
  Text,
  useDisclosure
} from '@chakra-ui/react';
import { QuestionOutlineIcon, CheckCircleIcon, InfoIcon } from '@chakra-ui/icons';
import { useRef } from 'react';

const TutorialDrawer = ({ isVisible }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();

  if (!isVisible) return null;

  return (
    <>
      <IconButton
        ref={btnRef}
        aria-label="チュートリアルを開く"
        icon={<QuestionOutlineIcon />}
        position="fixed"
        top={{ base: 4, md: 6 }}
        right={{ base: 4, md: 6 }}
        zIndex="popover"
        colorScheme="teal"
        onClick={onOpen}
      />
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        placement="right"
        finalFocusRef={btnRef}
        size={{ base: 'full', md: 'sm' }}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader display="flex" alignItems="center" gap={3}>
            <QuestionOutlineIcon />
            チュートリアル
          </DrawerHeader>
          <DrawerBody>
            <Text mb={4}>
              UI テスト用のチュートリアルです。キーボード操作にも対応しています。
            </Text>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                AuthDummy でログイン → シナリオ選択 → トレーニング開始の順に進めます。
              </ListItem>
              <ListItem>
                <ListIcon as={InfoIcon} color="blue.500" />
                モバイルでは左上・右上のボタンからシナリオとチャットを開閉できます。
              </ListItem>
              <ListItem>
                <ListIcon as={InfoIcon} color="blue.500" />
                チャット送信後は自動でダミー応答と採点が表示されます。
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                左下の「トレーニング終了」で採点サマリーとダッシュボードが表示されます。
              </ListItem>
              <ListItem>
                <ListIcon as={InfoIcon} color="blue.500" />
                Escape キーでこのチュートリアルを閉じることができます。
              </ListItem>
            </List>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default TutorialDrawer;
