import { sherif } from 'sherif';

export default sherif({
  version: '1',
  depRules: {
    'apps/*': {
      'react': '18.x',
      'react-dom': '18.x',
      '@types/react': '18.x',
      '@types/react-dom': '18.x'
    },
    'packages/*': {
      'react': '18.x',
      '@types/react': '18.x'
    }
  }
});
