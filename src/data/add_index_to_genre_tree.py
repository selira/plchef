import json

def add_index_to_genre_tree(genre_tree, index=0):
  genre_tree['index'] = index
  index += 1
  if 'subgenres' in genre_tree:
    for subgenre in genre_tree['subgenres']:
      index = add_index_to_genre_tree(subgenre, index)
  return index

# Open the genre_tree.json file
with open('genre_tree.json') as file:
  genre_tree = json.load(file)

global_index = 1

# Traverse the tree and add index to each object
for genre in genre_tree:
  global_index = add_index_to_genre_tree(genre, global_index)

# Traverse the tree and order by popularity, popularity is an integer, the higher the number, the less popular the genre
def order_by_popularity(genre_tree):
  if 'subgenres' in genre_tree:
    genre_tree['subgenres'] = sorted(genre_tree['subgenres'], key=lambda x: int(x['popularity']))
    for subgenre in genre_tree['subgenres']:
      order_by_popularity(subgenre)

for genre in genre_tree:
  order_by_popularity(genre)

#Also order the base list of genres by popularity
genre_tree = sorted(genre_tree, key=lambda x: int(x['popularity']))

# Print the updated genre tree
print(json.dumps(genre_tree, indent=4))

# Write the updated genre tree to a new file called genre_tree_with_index.json
with open('genre_tree_with_index.json', 'w') as file:
  json.dump(genre_tree, file, indent=4)
  