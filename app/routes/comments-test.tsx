import Comments from '~/comments/comments';

export const CommentsTest = () => {

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '6rem'
    }}>
      <Comments />
    </div>
  );
};
