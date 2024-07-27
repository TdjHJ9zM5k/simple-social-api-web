import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  AppBar,
  Toolbar,
  Snackbar,
  Alert,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  Avatar,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/system';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';

const API_BASE_URL = 'http://localhost:8080/api';

// Function to safely decode URI components
const safeDecodeURIComponent = (text) => {
  try {
    return decodeURIComponent(text.replace(/\+/g, ' '));
  } catch (e) {
    console.error('Decoding error:', e);
    return text;
  }
};

// Function to clean unwanted characters from post content and comments
const cleanContent = (text) => {
  return text.replace(/=\s*$/, ''); // Removes any trailing '=' characters
};

// Function to get the capitalized first letter of the username
const getAvatarLetter = (username) => {
  return username.charAt(0).toUpperCase();
};

// Styled ListItem component with hover effect
const StyledListItem = styled(ListItem)({
  paddingBottom: '16px',
  cursor: 'pointer',
  transition: 'background-color 0.3s',
  '&:hover': {
    backgroundColor: '#e0e0e0',
  },
});

// Styled Avatar components
const FollowedAvatar = styled(Avatar)({
  marginRight: '16px',
  backgroundColor: '#1976D2',
});

const DefaultAvatar = styled(Avatar)({
  marginRight: '16px',
  backgroundColor: 'grey',
});

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]); // Initialize as an empty array
  const [newPost, setNewPost] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null); // New state for image preview
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [users, setUsers] = useState([]);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const checkLoginAndFetchData = async () => {
      try {
        const userResponse = await axios.get(`${API_BASE_URL}/whoami`, { withCredentials: true });
        setUser(userResponse.data);

        if (userResponse.data) {
          const postsResponse = await axios.get(`${API_BASE_URL}/post/list-all-posts`, { withCredentials: true });
          const decodedPosts = await Promise.all(postsResponse.data.map(async (post) => {
            const decodedPost = safeDecodeURIComponent(post.post);
            const cleanedPost = cleanContent(decodedPost);
			
			let imageUrl = null;
			if (post.image_name) {
			 try {
				const imageResponse = await axios.get(`${API_BASE_URL}/post/image/${post.image_name}`, {
				  responseType: 'arraybuffer',
				  withCredentials: true, // Include credentials in the request
				});
				const imageBlob = new Blob([imageResponse.data], { type: 'image/png' });
				imageUrl = URL.createObjectURL(imageBlob);
			  } catch (error) {
				if (error.response && error.response.status === 404) {
				  console.warn('Image not found, skipping image rendering.');
				  // Handle the 404 error here, e.g., log it or set a default image URL if needed
				} else {
				  console.error('Error fetching image:', error);
				  // Handle other potential errors
				}
			  }
			}
			
			
            const commentsResponse = await axios.get(`${API_BASE_URL}/post/post-details/${post.post_id}`, { withCredentials: true });
            const comments = commentsResponse.data.comments.map(comment => ({
              ...comment,
              comment: cleanContent(safeDecodeURIComponent(comment.comment)),
            }));
            return {
              ...post,
              post: cleanedPost,
			  imageUrl: imageUrl,
              comments: comments,
            };
          }));
          setPosts(decodedPosts);

          const usersResponse = await axios.get(`${API_BASE_URL}/user/list-all-users`, { withCredentials: true });
          const allUsers = usersResponse.data;

          const followedUsersResponse = await axios.get(`${API_BASE_URL}/user/list-followed-users`, { withCredentials: true });
          setFollowedUsers(followedUsersResponse.data);

          // Place followed users at the top of the user list
          const filteredUsers = allUsers.filter(u => u.id !== userResponse.data.id);
          const sortedUsers = [
            ...followedUsersResponse.data,
            ...filteredUsers.filter(u => !followedUsersResponse.data.some(f => f.id === u.id)),
          ];
          setUsers(sortedUsers);
        }
      } catch (error) {
			//setSnackbar({ open: true, message: 'Error fetching data', severity: 'error' });
			console.error('Error fetching data:', error);
      }
    };

    checkLoginAndFetchData();
  }, []);

  const handleLogin = async () => {
    try {
      await axios.post(`${API_BASE_URL}/signin`, { username, password }, { withCredentials: true });
      window.location.reload();
    } catch (error) {
      setSnackbar({ open: true, message: 'Login failed', severity: 'error' });
      console.error('Login error:', error);
    }
  };

  const handleRegister = async () => {
    try {
      await axios.post(`${API_BASE_URL}/signup`, { username, password }, { withCredentials: true });
      setSnackbar({ open: true, message: 'Registration successful! Please log in.', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Registration failed', severity: 'error' });
      console.error('Registration error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/signout`, {}, { withCredentials: true });
      setUser(null);
      setPosts([]);
      setUsers([]);
      setFollowedUsers([]);
      setSnackbar({ open: true, message: 'Logged out successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Logout failed', severity: 'error' });
      console.error('Logout error:', error);
    }
  };

  const handlePost = async () => {
    try {
      const formData = new FormData();
      formData.append('post', newPost);
      if (image) {
        formData.append('image', image);
      }

      await axios.post(`${API_BASE_URL}/post/add`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setNewPost('');
      setImage(null);
      setImagePreview(null); // Clear the preview after posting

      // Refresh the posts after successful submission
      const postsResponse = await axios.get(`${API_BASE_URL}/post/list-all-posts`, { withCredentials: true });
      const postsWithImages = await Promise.all(postsResponse.data.map(async (post) => {
        const decodedPost = safeDecodeURIComponent(post.post);
        const cleanedPost = cleanContent(decodedPost);

        let imageUrl = null;
		if (post.image_name) {
			 try {
			const imageResponse = await axios.get(`${API_BASE_URL}/post/image/${post.image_name}`, {
			  responseType: 'arraybuffer',
			  withCredentials: true, // Include credentials in the request
			});
			const imageBlob = new Blob([imageResponse.data], { type: 'image/png' });
			imageUrl = URL.createObjectURL(imageBlob);
		  } catch (error) {
			if (error.response && error.response.status === 404) {
			  console.warn('Image not found, skipping image rendering.');
			  // Handle the 404 error here, e.g., log it or set a default image URL if needed
			} else {
			  console.error('Error fetching image:', error);
			  // Handle other potential errors
			}
		  }
		}

        const commentsResponse = await axios.get(`${API_BASE_URL}/post/post-details/${post.post_id}`, { withCredentials: true });
        const comments = commentsResponse.data.comments.map(comment => ({
          ...comment,
          comment: cleanContent(safeDecodeURIComponent(comment.comment)),
        }));

        return {
          ...post,
          post: cleanedPost,
          imageUrl: imageUrl,
          comments: comments,
        };
      }));
      setPosts(postsWithImages);

      setSnackbar({ open: true, message: 'Post added successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error adding post', severity: 'error' });
      console.error('Error adding post:', error);
    }
  };

  const handleFollowUser = async (usernameId) => {
    const isFollowing = followedUsers.some(f => f.id === usernameId);
    const apiUrl = isFollowing
      ? `${API_BASE_URL}/user/unfollow/${usernameId}`
      : `${API_BASE_URL}/user/follow/${usernameId}`;

    try {
      await axios.post(apiUrl, {}, { withCredentials: true });
      const message = isFollowing ? `Unfollowed user ${usernameId}` : `Followed user ${usernameId}`;
      setSnackbar({ open: true, message, severity: 'success' });

      // Update followed users
      const updatedFollowedUsersResponse = await axios.get(`${API_BASE_URL}/user/list-followed-users`, { withCredentials: true });
      setFollowedUsers(updatedFollowedUsersResponse.data);

      // Update user list
      const usersResponse = await axios.get(`${API_BASE_URL}/user/list-all-users`, { withCredentials: true });
      const allUsers = usersResponse.data;
      const filteredUsers = allUsers.filter(u => u.id !== user.id);
      const sortedUsers = [
        ...updatedFollowedUsersResponse.data,
        ...filteredUsers.filter(u => !updatedFollowedUsersResponse.data.some(f => f.id === u.id)),
      ];
      setUsers(sortedUsers);

      // Update posts
      const postsResponse = await axios.get(`${API_BASE_URL}/post/list-all-posts`, { withCredentials: true });
      const decodedPosts = await Promise.all(postsResponse.data.map(async (post) => {
        const decodedPost = safeDecodeURIComponent(post.post);
        const cleanedPost = cleanContent(decodedPost);
		
		let imageUrl = null;
		if (post.image_name) {
			 try {
			const imageResponse = await axios.get(`${API_BASE_URL}/post/image/${post.image_name}`, {
			  responseType: 'arraybuffer',
			  withCredentials: true, // Include credentials in the request
			});
			const imageBlob = new Blob([imageResponse.data], { type: 'image/png' });
			imageUrl = URL.createObjectURL(imageBlob);
		  } catch (error) {
			if (error.response && error.response.status === 404) {
			  console.warn('Image not found, skipping image rendering.');
			  // Handle the 404 error here, e.g., log it or set a default image URL if needed
			} else {
			  console.error('Error fetching image:', error);
			  // Handle other potential errors
			}
		  }
		}
		
        const commentsResponse = await axios.get(`${API_BASE_URL}/post/post-details/${post.post_id}`, { withCredentials: true });
        const comments = commentsResponse.data.comments.map(comment => ({
          ...comment,
          comment: cleanContent(safeDecodeURIComponent(comment.comment)),
        }));
        return {
          ...post,
          post: cleanedPost,
          imageUrl: imageUrl,
          comments: comments,
        };
      }));
      setPosts(decodedPosts);

    } catch (error) {
      setSnackbar({ open: true, message: `Error ${isFollowing ? 'unfollowing' : 'following'} user`, severity: 'error' });
      console.error(`Error ${isFollowing ? 'unfollowing' : 'following'} user:`, error);
    }
  };

  const handleAddComment = async (postId, commentText, setComment) => {
    try {
      await axios.post(`${API_BASE_URL}/post/${postId}/comment/add`, commentText , { withCredentials: true });
      setComment('');

      // Update post with new comment
      const postsResponse = await axios.get(`${API_BASE_URL}/post/list-all-posts`, { withCredentials: true });
      const decodedPosts = await Promise.all(postsResponse.data.map(async (post) => {
        const decodedPost = safeDecodeURIComponent(post.post);
        const cleanedPost = cleanContent(decodedPost);
		
		let imageUrl = null;
		if (post.image_name) {
			 try {
			const imageResponse = await axios.get(`${API_BASE_URL}/post/image/${post.image_name}`, {
			  responseType: 'arraybuffer',
			  withCredentials: true, // Include credentials in the request
			});
			const imageBlob = new Blob([imageResponse.data], { type: 'image/png' });
			imageUrl = URL.createObjectURL(imageBlob);
		  } catch (error) {
			if (error.response && error.response.status === 404) {
			  console.warn('Image not found, skipping image rendering.');
			  // Handle the 404 error here, e.g., log it or set a default image URL if needed
			} else {
			  console.error('Error fetching image:', error);
			  // Handle other potential errors
			}
		  }
		}
		
        const commentsResponse = await axios.get(`${API_BASE_URL}/post/post-details/${post.post_id}`, { withCredentials: true });
        const comments = commentsResponse.data.comments.map(comment => ({
          ...comment,
          comment: cleanContent(safeDecodeURIComponent(comment.comment)),
        }));
        return {
          ...post,
          post: cleanedPost,
          imageUrl: imageUrl,
          comments: comments,
        };
      }));
      setPosts(decodedPosts);

      setSnackbar({ open: true, message: 'Comment added successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error adding comment', severity: 'error' });
      console.error('Error adding comment:', error);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    setImage(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleImageCancel = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await axios.post(`${API_BASE_URL}/post/${postId}/comment/delete/${commentId}`, {}, { withCredentials: true });

      // Update posts without the deleted comment
      const postsResponse = await axios.get(`${API_BASE_URL}/post/list-all-posts`, { withCredentials: true });
      const decodedPosts = await Promise.all(postsResponse.data.map(async (post) => {
        const decodedPost = safeDecodeURIComponent(post.post);
        const cleanedPost = cleanContent(decodedPost);
		
		let imageUrl = null;
		if (post.image_name) {
			 try {
			const imageResponse = await axios.get(`${API_BASE_URL}/post/image/${post.image_name}`, {
			  responseType: 'arraybuffer',
			  withCredentials: true, // Include credentials in the request
			});
			const imageBlob = new Blob([imageResponse.data], { type: 'image/png' });
			imageUrl = URL.createObjectURL(imageBlob);
		  } catch (error) {
			if (error.response && error.response.status === 404) {
			  console.warn('Image not found, skipping image rendering.');
			  // Handle the 404 error here, e.g., log it or set a default image URL if needed
			} else {
			  console.error('Error fetching image:', error);
			  // Handle other potential errors
			}
		  }
		}
		
        const commentsResponse = await axios.get(`${API_BASE_URL}/post/post-details/${post.post_id}`, { withCredentials: true });
        const comments = commentsResponse.data.comments.map(comment => ({
          ...comment,
          comment: cleanContent(safeDecodeURIComponent(comment.comment)),
        }));
        return {
          ...post,
          post: cleanedPost,
          imageUrl: imageUrl,
          comments: comments,
        };
      }));
      setPosts(decodedPosts);
      setSnackbar({ open: true, message: 'Comment deleted successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error deleting comment', severity: 'error' });
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            Social Network Web
          </Typography>
          {user ? (
            <>
              <Typography variant="h6" style={{ marginRight: '16px' }}>
                Welcome, {user.username}
              </Typography>
              <Button color="inherit" variant="h6" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <div>
              
            </div>
          )}
        </Toolbar>
      </AppBar>

      {user ? (
        <Container style={{ display: 'flex', flexDirection: 'row', marginTop: '20px' }}>
          <Box flex={3} display="flex" flexDirection="column" mr={1.6}>
            <Box flex={1} mb={3} display="flex" flexDirection="column">
              <Typography variant="h5" style={{ marginBottom: '6px', marginLeft: '4px'  }}>Create a New Post</Typography>
              <Paper elevation={3} style={{ padding: '16px', overflowY: 'auto' }}>
                <Box display="flex" alignItems="center">
                  <TextField
                    fullWidth
                    multiline
                    rows={1}
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Write your post here..."
                    variant="outlined"
                    margin="normal"
                    style={{ marginRight: '16px' }}
                  />
				  </Box>
				  
				  
				  {imagePreview && (
					<Box marginTop={1} marginBottom={1} position="relative" display="inline-block">
					  <img
						src={imagePreview}
						alt="Preview"
						style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
					  />
					  <IconButton
						onClick={handleImageCancel}
						style={{ position: 'absolute', top: 0, right: 0 }}
					  >
						<CancelIcon />
					  </IconButton>
					  
					</Box>
				  )}
				  
				  <div></div>
				   <input
					accept="image/*"
					style={{ display: 'none' }}
					id="upload-image"
					type="file"
					onChange={handleImageChange}
				  />
				  <label htmlFor="upload-image">
					<Button variant="contained" component="span" style={{ marginRight: '16px' }}>
					  Upload Image
					</Button>
				  </label>	
				  
				  
				  
                  <Button variant="contained" color="primary" onClick={handlePost}>
                    Post
                  </Button>
                
              </Paper>
            </Box>
            <Box flex={1} mb={1.6} display="flex" flexDirection="column">
              <Typography variant="h5" style={{ marginBottom: '6px', marginLeft: '4px'  }}>All Posts</Typography>
              <Paper elevation={3} style={{ padding: '16px', height: 'calc(120% - 16px)', overflowY: 'auto', flexGrow: 1 }}>
                {posts && posts.length > 0 ? (
                  <List>
                    {posts.map((post) => (
                      <Paper key={post.post_id} style={{ padding: '16px', margin: '8px 0' }}>
					  {post.imageUrl && (
							<img
							  src={post.imageUrl}
							  alt="Post"
							  style={{ marginTop: '8px', maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
							/>
						  )}
                        <Typography variant="h6">{post.post}</Typography>
						 
						  
                        <Typography variant="subtitle1" color="textSecondary">Posted by {post.author} on {post.date}</Typography>
                        <List>
                          {post.comments && post.comments.length > 0 ? (
                            post.comments.map((comment) => (
                              <ListItem key={comment.comment_id}>
                                <ListItemText
                                  primary={<Typography variant="body2">{comment.comment}</Typography>}
                                  secondary={`${comment.author} commented on ${comment.date}`}
                                />
                                {comment.author === user.username && (
                                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteComment(post.post_id, comment.comment_id)}>
                                    <DeleteIcon />
                                  </IconButton>
                                )}
                              </ListItem>
                            ))
                          ) : (
                            <Typography variant="body2">No comments</Typography>
                          )}
                        </List>
                        <Box display="flex" alignItems="center" mt={1}>
                          <TextField
                            fullWidth
                            multiline
                            rows={1}
                            placeholder="Write a comment..."
                            variant="outlined"
                            margin="normal"
                            style={{ marginRight: '16px' }}
                            value={post.newComment || ''}
                            onChange={(e) => {
                              const updatedPosts = posts.map(p => p.post_id === post.post_id ? { ...p, newComment: e.target.value } : p);
                              setPosts(updatedPosts);
                            }}
                          />
                          <Button variant="contained" color="primary" onClick={() => handleAddComment(post.post_id, post.newComment, (value) => {
                            const updatedPosts = posts.map(p => p.post_id === post.post_id ? { ...p, newComment: value } : p);
                            setPosts(updatedPosts);
                          })}>
                            Comment
                          </Button>
                        </Box>
                      </Paper>
                    ))}
                  </List>
                ) : (
                  <Typography>No posts available</Typography>
                )}
              </Paper>
            </Box>
          </Box>
          <Box flex={1} ml={1.6} style={{ maxWidth: '280px' }}>
            <Typography variant="h5" style={{ marginBottom: '6px', marginLeft: '4px' }}>All Users</Typography>
            <Paper elevation={3} style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
              {users && users.length > 0 ? (
                <List>
                  {users.map((user) => (
                    <StyledListItem key={user.id} onClick={() => handleFollowUser(user.id)}>
                      {followedUsers.some(f => f.id === user.id) ? (
                        <FollowedAvatar>
                          {getAvatarLetter(user.username)}
                        </FollowedAvatar>
                      ) : (
                        <DefaultAvatar>
                          {getAvatarLetter(user.username)}
                        </DefaultAvatar>
                      )}
                      <ListItemText
                        primary={<Typography variant="body1">{user.username}</Typography>}
                        secondary={followedUsers.some(f => f.id === user.id) ? 'Following' : ''}
                      />
                    </StyledListItem>
                  ))}
                </List>
              ) : (
                <Typography>No users available</Typography>
              )}
            </Paper>
          </Box>
        </Container>
      ) : (
        <Container style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Paper elevation={3} style={{ padding: '16px', width: '300px', textAlign: 'center' }}>
            <Typography variant="h4">Login or Register</Typography>
            <TextField
              fullWidth
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              variant="outlined"
              margin="normal"
              required
            />
            <TextField
              fullWidth
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              variant="outlined"
              margin="normal"
              required
            />
            <Button variant="contained" color="primary" onClick={handleLogin}>Login</Button>
            <Button variant="outlined" color="secondary" onClick={handleRegister} style={{ marginLeft: '26px'}}>Register</Button>
          </Paper>
        </Container>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;
