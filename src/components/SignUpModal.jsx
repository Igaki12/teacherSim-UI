import {
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useRef, useState } from 'react';

const SignUpModal = ({ isOpen, onClose }) => {
  const initialRef = useRef();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleSendCode = () => {
    if (!email) {
      setStatus('メールアドレスを入力してください。');
      return;
    }
    setStatus(`${email} に認証コードを送信しました（ダミー）。`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!acceptTerms) {
      setStatus('利用規約への同意が必要です。');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('パスワードが一致しません。');
      return;
    }
    setStatus('仮登録を受け付けました。メールを確認してください。');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={initialRef} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>新規アカウント登録</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Stack spacing={4}>
              <Text fontSize="sm" color="gray.600">
                教師研修用アカウントを登録します。メールアドレスとパスワードを設定し、認証コードで確認してください。
              </Text>
              <FormControl isRequired>
                <FormLabel htmlFor="signup-email">メールアドレス</FormLabel>
                <Input
                  ref={initialRef}
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="teacher@example.com"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel htmlFor="signup-verification">認証コード</FormLabel>
                <HStack spacing={2} align="flex-end">
                  <Input
                    id="signup-verification"
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value)}
                    placeholder="6桁コード"
                  />
                  <Button onClick={handleSendCode} variant="outline">
                    コード送信
                  </Button>
                </HStack>
              </FormControl>
              <FormControl isRequired>
                <FormLabel htmlFor="signup-password">パスワード</FormLabel>
                <InputGroup>
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="8文字以上"
                  />
                  <InputRightElement width="3rem">
                    <IconButton
                      aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      h="1.5rem"
                      w="1.5rem"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPassword((prev) => !prev)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <FormControl isRequired>
                <FormLabel htmlFor="signup-password-confirm">パスワード（確認）</FormLabel>
                <InputGroup>
                  <Input
                    id="signup-password-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="同じパスワードを入力"
                  />
                  <InputRightElement width="3rem">
                    <IconButton
                      aria-label={showConfirmPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                      icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                      h="1.5rem"
                      w="1.5rem"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <Checkbox isChecked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)}>
                <Text as="span" fontSize="sm">
                  利用規約とプライバシーポリシーに同意します。
                </Text>
              </Checkbox>
              {status && (
                <Text fontSize="sm" color="blue.500" aria-live="polite">
                  {status}
                </Text>
              )}
              <Divider />
              <Stack spacing={2}>
                <Button variant="outline" onClick={() => setStatus('サポートチームにお問い合わせください（ダミー）。')}>
                  FAQ / サポート
                </Button>
                <Button variant="ghost">教育委員会アカウントと連携</Button>
              </Stack>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              閉じる
            </Button>
            <Button type="submit" colorScheme="green">
              仮登録する
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default SignUpModal;
