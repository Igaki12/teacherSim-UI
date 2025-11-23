import {
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Spacer,
  Stack,
  Text,
  useDisclosure,
  useColorModeValue
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import useAppStore from '../store/useAppStore.js';
import SignUpModal from './SignUpModal.jsx';

const AuthDummy = ({ onAfterLogin }) => {
  const { isAuthenticated, login, logout } = useAppStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    login: state.login,
    logout: state.logout
  }));
  const signUpModal = useDisclosure();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [status, setStatus] = useState('');

  const handleLogin = (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setStatus('メールアドレスとパスワードを入力してください。');
      return;
    }
    const nextName = name.trim() || email.trim() || 'ゲスト';
    login(nextName);
    setStatus(`${nextName} としてログインしました。`);
    setEmail('');
    setPassword('');
    if (typeof onAfterLogin === 'function') {
      onAfterLogin(nextName);
    }
  };

  const handleLogout = () => {
    logout();
    setName('');
    setEmail('');
    setPassword('');
    setStatus('ログアウトしました。');
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setStatus('パスワードリセットにはメールアドレスが必要です。');
      return;
    }
    setStatus(`${email.trim()} にリセット手順を送信しました（ダミー）。`);
  };

  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <>
      <Box
        mb={4}
        role="region"
        aria-label="認証ダミーエリア"
        maxH={{ base: '70vh', md: 'none' }}
        overflowY="auto"
        pr={{ base: 2, md: 0 }}
      >
        <Card bg={cardBg} shadow="sm" borderWidth="1px">
          <CardBody>
            <Stack spacing={4}>
              {!isAuthenticated ? (
                <form onSubmit={handleLogin}>
                  <Stack spacing={4}>
                    {status && (
                      <Text fontSize="sm" color="blue.500" aria-live="polite">
                        {status}
                      </Text>
                    )}
                    <FormControl isRequired>
                      <FormLabel htmlFor="login-email">メールアドレス</FormLabel>
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        placeholder="teacher@example.com"
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel htmlFor="login-password">パスワード</FormLabel>
                      <InputGroup>
                        <Input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          placeholder="8文字以上"
                          onChange={(event) => setPassword(event.target.value)}
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
                      <Button variant="link" size="sm" onClick={handleForgotPassword} mt={2}>
                        パスワードをお忘れですか？
                      </Button>
                    </FormControl>
                    <FormControl>
                      <FormLabel htmlFor="demo-name">表示名（任意）</FormLabel>
                      <Input
                        id="demo-name"
                        value={name}
                        placeholder="例: 田中先生"
                        onChange={(event) => setName(event.target.value)}
                      />
                    </FormControl>
                    <HStack justify="space-between" align={{ base: 'flex-start', sm: 'center' }}>
                      <Checkbox
                        isChecked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                      >
                        ログイン状態を保存
                      </Checkbox>

                    </HStack>

                    <Button type="submit" colorScheme="blue">
                      ログイン
                    </Button>
                    <Stack spacing={1} direction={{ base: 'column', sm: 'row' }} align="flex-start">
                      <Text fontSize="sm" color="gray.600">
                        アカウントをお持ちでない場合：
                      </Text>
                      <Button variant="link" size="sm" colorScheme="blue" onClick={signUpModal.onOpen}>
                        サインアップ
                      </Button>
                    </Stack>
                  </Stack>
                </form>
              ) : (
                <Stack spacing={1}>
                  <HStack>
                    {status && (
                      <Text fontSize="sm" color="blue.500">
                        {status}
                      </Text>
                    )}
                    <Spacer />
                    <Button onClick={handleLogout}>ログアウト</Button>
                  </HStack>
                </Stack>
              )}
            </Stack>
          </CardBody>
        </Card>
      </Box>
      <SignUpModal isOpen={signUpModal.isOpen} onClose={signUpModal.onClose} />
    </>
  );
};

export default AuthDummy;
