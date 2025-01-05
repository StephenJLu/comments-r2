import { useEffect } from 'react';
import { Form, useActionData, useLoaderData, useNavigate } from '@remix-run/react';
import { json } from '@remix-run/cloudflare';
import paths from './paths.json';

interface ActionData {
  success?: boolean;
  errors?: {
    name?: string;
    comment?: string;
  };
}

interface Comment {
  name: string;
  comment: string;
  timestamp: string;
}

interface LoaderData {
  comments: Comment[];
}

interface CloudflareContext {
  cloudflare: {
    env: {
      AUTH_KEY_SECRET: string;
    };
  };
}

const STORAGE_URL = paths.storage_url; // CHANGE TO YOUR R2 STORAGE URL IN PATHS.JSON
const WORKER_URL =  paths.worker_url; // CHANGE TO YOUR R2 WORKER URL IN PATHS.JSON

export const loader = async () => {
  try {
    console.log('Fetching comments...');
    const response = await fetch(STORAGE_URL); 
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Failed to fetch:', response.status);
      return json<LoaderData>({ comments: [] });
    }

    const text = await response.text();
    console.log('Raw response:', text);

    const data = JSON.parse(text);
    console.log('Parsed data:', data);

    if (!Array.isArray(data)) {
      console.error('Data is not an array');
      return json<LoaderData>({ comments: [] });
    }

    const validComments = data.filter(Boolean);
    console.log('Valid comments:', validComments);

    return json<LoaderData>({ comments: validComments });
  } catch (error) {
    console.error('Loader error:', error);
    return json<LoaderData>({ comments: [] });
  }
};

export const action = async ({ request, context }: { request: Request; context: CloudflareContext }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  // Handle delete
  if (intent === 'delete') {
    const timestamp = formData.get('timestamp') as string;
    if (!timestamp) {
      return json<ActionData>({ success: false, errors: { comment: 'Missing timestamp for deletion' } });
    }

    const response = await fetch(WORKER_URL, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.AUTH_KEY_SECRET,
      },
      body: JSON.stringify({ timestamp })
    });

    if (!response.ok) throw new Error('Failed to delete comment');
    return json<ActionData>({ success: true });
  }

  // Existing comment creation logic
  try {
    const name = formData.get('name') as string;
    const comment = formData.get('comment') as string;

    if (!name || !comment) {
      return json<ActionData>({
        success: false,
        errors: {
          name: !name ? 'Name is required' : undefined,
          comment: !comment ? 'Comment is required' : undefined,
        },
      });
    }

    const response = await fetch(WORKER_URL, {
      method: 'PUT',
       headers: {
    'Content-Type': 'application/json',
    'X-Custom-Auth-Key': context.cloudflare.env.AUTH_KEY_SECRET,
  },
      body: JSON.stringify({ name, comment, timestamp: new Date().toISOString() }),
    });

    if (!response.ok) throw new Error('Failed to save comment');
    return json<ActionData>({ success: true });
  } catch {
    return json<ActionData>({ success: false, errors: { comment: 'Failed to save comment' } });
  }
};

export default function Comments() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigate = useNavigate();  

  useEffect(() => {
    if (actionData?.success) navigate('.', { replace: true });
  }, [actionData?.success, navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '6rem'
    }}>
      <h1>Comments</h1>
      <Form 
        method="post" 
        style={{ 
          marginTop: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          width: '100%',
          maxWidth: '500px'
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          Name
          <input
            required
            name="name"
            type="text"
            maxLength={255}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: actionData?.errors?.name ? '1px solid red' : '1px solid #ccc'
            }}
          />
        </label>
        
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          Comment
          <textarea
            required
            name="comment"
            maxLength={255}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: actionData?.errors?.comment ? '1px solid red' : '1px solid #ccc',
              minHeight: '100px'
            }}
          />
        </label>

       <button 
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          onFocus={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onBlur={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          Submit Comment
        </button>
      </Form>

      {actionData?.success && (
        <div style={{ marginTop: '1rem', color: 'green' }}>
          ✓ Comment submitted successfully
        </div>
      )}
      {actionData?.errors && (
        <div style={{ marginTop: '1rem', color: 'red' }}>
          ✗ {Object.values(actionData.errors).filter(Boolean).join(', ')}
        </div>
      )}

      <div style={{ 
        marginTop: '2rem',
        width: '100%',
        maxWidth: '500px'
      }}>
        <h2>Comments ({loaderData.comments.length})</h2>
        <div style={{ marginTop: '1rem' }}>
          {loaderData.comments.length === 0 ? (
            <div>No comments yet!</div>
          ) : (
            loaderData.comments.map((comment, index) => (
              <div 
                key={index} 
                style={{
                  padding: '1rem',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  marginBottom: '1rem',
                  position: 'relative'
                }}
              >
                <Form method="post" style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                  <input type="hidden" name="timestamp" value={comment.timestamp} />
                  <button
                    type="submit"
                    name="intent"
                    value="delete"
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      if (!confirm('Are you sure you want to delete this comment?')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    Delete
                  </button>
                </Form>
                <strong>{comment.name}</strong>
                <p style={{ margin: '0.5rem 0' }}>{comment.comment}</p>
                <small style={{ color: '#666' }}>
                  {new Date(comment.timestamp).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}