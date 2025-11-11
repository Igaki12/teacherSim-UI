import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Spacer,
  Stack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { useState } from 'react';
import useAppStore from '../store/useAppStore.js';

const AuthDummy = () => {
  const { isAuthenticated, login, logout, userName } = useAppStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    login: state.login,
    logout: state.logout,
    userName: state.userName
  }));
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  const handleLogin = (event) => {
    event.preventDefault();
    const nextName = name.trim() || 'ゲスト';
    login(nextName);
    setStatus(`${nextName} としてログインしました。`);
  };

  const handleLogout = () => {
    logout();
    setName('');
    setStatus('ログアウトしました。');
  };

  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box mb={4} role="region" aria-label="認証ダミーエリア">
      <Card bg={cardBg} shadow="sm" borderWidth="1px">
        <CardBody>
          <Stack spacing={4}>
            {/* <Text fontSize="lg" fontWeight="bold">
              デモ用ログイン
            </Text> */}
            {!isAuthenticated ? (
              <form onSubmit={handleLogin}>
                <Stack spacing={4}>
                  <FormControl>
                    <FormLabel htmlFor="demo-name">表示名</FormLabel>
                    <Input
                      id="demo-name"
                      value={name}
                      placeholder="例: 田中先生"
                      onChange={(event) => setName(event.target.value)}
                    />
                  </FormControl>
                  <Button type="submit" colorScheme="blue">
                    ログイン
                  </Button>
                  <Text fontSize="sm" color="gray.500">
                    認証はダミーです。ログイン完了まで他コンポーネントは表示されません。
                  </Text>
                </Stack>
              </form>
            ) : (
              <Stack spacing={1}>
                {/* <Alert status="success" variant="subtle">
                  <AlertIcon />
                  <Stack spacing={1}>
                    <AlertTitle>ログイン済み</AlertTitle>
                    <AlertDescription>
                      {userName} としてシミュレーションを開始できます。
                    </AlertDescription>
                  </Stack>
                </Alert> */}
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
            {/* <Box aria-live="polite" minH="1.5rem">
              {status && (
                <Text fontSize="sm" color="blue.500">
                  {status}
                </Text>
              )}
            </Box> */}
          </Stack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default AuthDummy;
