import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import useAppStore from '../store/useAppStore';

const AppFooter = () => {
  const bg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { isAuthenticated } = useAppStore();

  if (isAuthenticated) {
    return null;
  }
  return (
    <Box
      as="footer"
      bg={bg}
      borderTopWidth="1px"
      borderColor={borderColor}
      px={{ base: 4, md: 8 }}
      py={4}
    >
      <Text fontSize="sm" color="gray.500">
        © 2025 TeacherSim UI Demo. Kidokaede Igatatsu
      </Text>
    </Box>
  );
};

export default AppFooter;
