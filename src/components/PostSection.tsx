import { View, Text } from 'react-native';
import { PostCard } from './PostCard';
import { s } from '../styles';
import type { User } from '../types';
import { acct } from '../persist';
import { explorePostsKey, pagePosts } from '../postTargets';

export type PostPage = 'explore' | 'boards' | 'events';

// Lists the posts the person made on a page (today: Explore). Writing a post happens in the shared composer (screens/CreatePost.tsx),
// which every "+" button opens, so there is a single composer and no second copy of its state.
export function PostSection({ page, user }: { page: PostPage; user?: User | null }) {
  const posts = pagePosts.useItems(page === 'explore' ? explorePostsKey(user?.email) : `${acct(user?.email)}|${page}`);
  return (
    <View>
      {posts.length > 0 && <Text style={[s.sectionSub, { marginBottom: 10 }]}>Your posts</Text>}
      {posts.map((p) => <PostCard key={p.id} p={p} user={user} />)}
    </View>
  );
}
