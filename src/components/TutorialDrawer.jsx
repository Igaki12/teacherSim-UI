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
import {
  QuestionOutlineIcon,
  CheckCircleIcon,
  InfoIcon,
  HamburgerIcon,
  ChatIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import { useRef } from 'react';

const TutorialDrawer = ({ isVisible }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();

  if (!isVisible) return null;

  return (
    <>
      <IconButton
        ref={btnRef}
        aria-label={isOpen ? 'チュートリアルを閉じる' : 'チュートリアルを開く'}
        icon={<QuestionOutlineIcon />}
        position="fixed"
        top="37px"
        right="33px"
        zIndex="popover"
        colorScheme="teal"
        onClick={isOpen ? onClose : onOpen}
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
          <DrawerHeader textAlign={"center"}>
            チュートリアル
          </DrawerHeader>
          <DrawerBody>
            <Text mb={4}>
              UI テスト用のチュートリアルです。キーボード操作にも対応しています。
            </Text>
            <Text fontWeight="bold" fontSize="sm" mt={2} mb={2}>
              テストの流れ（全デバイス共通）
            </Text>
            <List spacing={3} mb={6}>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                ログインすると、シチュエーションをチェックし「この状況で開始」を押すと開始後はロックされます。リセットすることで再度選び直せます。
              </ListItem>
              <ListItem>
                <ListIcon as={InfoIcon} color="blue.500" />
                中央の VRM ステージと右のチャットは開始直後から常時アクセスできます。3D モデルの様子を見ながら、チャットでモデルとやり取りを行ってください。
              </ListItem>
              <ListItem>
                <ListIcon as={InfoIcon} color="blue.500" />
                送信したメッセージごとにダミーの応答が追加されます。 画面下部の「正面を向く」ボタンでモデルの向きをリセットし、右下の背景切り替えアイコンで背景を変更できます。
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                左下固定の「トレーニング終了」を押すと確認ダイアログが表示されます。「はい」を選ぶと ScoreSummary と ProgressDashboard が解放され、セッション全体を振り返るモードに切り替わります。
              </ListItem>
              <ListItem>
                <ListIcon as={InfoIcon} color="blue.500" />
                途中で挙動を確かめたい場合は SidebarScenario の「リセット」を選び、アラートの指示通りに操作すると履歴が初期化されます。
              </ListItem>
            </List>

            <Text fontWeight="bold" fontSize="sm" mt={2} mb={2}>
              固定ボタンと Drawer の役割
            </Text>
            <List spacing={3} mb={6}>
              <ListItem>
                <ListIcon as={HamburgerIcon} color="blue.500" />
                左上の三本線アイコンでシナリオ Drawer を開閉します。ゴール・評価観点・オープニング例がまとまっており、閉じると中央の 3D をフルスクリーンに戻せます。
              </ListItem>
              <ListItem>
                <ListIcon as={ChatIcon} color="pink.400" />
                右上の吹き出しアイコンはチャット Drawer です。履歴、音声入力ダミーボタン、ScorePerUtterance のリストにアクセスでき、モバイルでも Enter 送信/Shift+Enter 改行が利用できます。
              </ListItem>
              <ListItem>
                <ListIcon as={QuestionOutlineIcon} color="teal.500" />
                このチュートリアルボタンは常に右上へ固定されています。Drawer は role="dialog" とフォーカストラップを備え、Escape キーでも閉じられます。
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                左下の「トレーニング終了」固定ボタンから採点フェーズに移ります。確認モーダルは「これで採点してもよろしいですか？」と問いかけ、了承後は ScoreSummary → ProgressDashboard の流れで結果が開きます。
              </ListItem>
            </List>

            <Text fontWeight="bold" fontSize="sm" mt={2} mb={2}>
              3D モデルと背景の操作ヒント
            </Text>
            <List spacing={3}>
              <ListItem>
                <ListIcon as={InfoIcon} color="blue.500" />
                モデルビューアは OrbitControls が有効です。ドラッグで視点回転、ホイール/ピンチでズーム、Shift+ドラッグで平行移動ができます。操作中も FPS と状態インジケータで負荷を確認できます。
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="green.500" />
                画面下の「正面を向く」ボタンを押すとモデルの向きと視点ターゲットが正面の対話ポジションに戻り、会話を再開しやすくなります。
              </ListItem>
              <ListItem>
                <ListIcon as={RepeatIcon} color="purple.500" />
                右下の背景切り替えアイコンで `運動会グラウンド → 校門 → 教室` の 3 枚を順に切り替えられます。背景は Canvas 背面で同期し、Stage 全体が常に透明に保たれます。
              </ListItem>
            </List>

            <Text mt={6} fontSize="sm" color="gray.600">
              ドロワー/モーダルはすべて role="dialog" + aria-modal="true" を付与しており、キーボードのみでも閉じる・移動する操作が可能です。
            </Text>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default TutorialDrawer;
