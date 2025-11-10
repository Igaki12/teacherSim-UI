import {
  Box,
  Flex,
  Heading,
  IconButton,
  Text,
  useColorMode,
  useColorModeValue
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import useAppStore from '../store/useAppStore.js';

const AppHeader = () => {
  const { started, currentScenarioId } = useAppStore((state) => ({
    started: state.started,
    currentScenarioId: state.currentScenarioId
  }));
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      as="header"
      position="sticky"
      top="0"
      zIndex="banner"
      bg={bg}
      borderBottomWidth="1px"
      borderColor={borderColor}
      px={{ base: 4, md: 8 }}
      py={4}
    >
      <Flex align="center" gap={4}>
        <Heading size="md">TeacherSim UI デモ</Heading>
        {started && (
          <Text
            fontSize="sm"
            color={useColorModeValue('green.600', 'green.300')}
            aria-live="polite"
          >
            セッション中: {currentScenarioId}
          </Text>
        )}
        <Flex ml="auto" align="center">
          <IconButton
            variant="ghost"
            colorScheme="blue"
            aria-label="カラーモード切り替え"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
          />
        </Flex>
      </Flex>
    </Box>
  );
};

export default AppHeader;
