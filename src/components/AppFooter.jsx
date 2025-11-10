import { Box, Text, useColorModeValue } from '@chakra-ui/react';

const AppFooter = () => {
  const bg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
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
        © {new Date().getFullYear()} TeacherSim UI Demo
      </Text>
    </Box>
  );
};

export default AppFooter;
