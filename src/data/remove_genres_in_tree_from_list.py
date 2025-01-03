import json

# Open the genre_tree.json file
with open('genre_tree.json') as tree_file:
  genre_tree = json.load(tree_file)

# Open the genre_list.json file
with open('genre_list.json') as list_file:
  genre_list = json.load(list_file)

# Get the list of genres from genre_list.json
genres = genre_list

# Loop through each genre in genre_tree.json
def remove_genres(tree):
  if isinstance(tree, list):
    for genre in tree:
      remove_genres(genre)
  elif isinstance(tree, dict):
    if 'subgenres' in tree:
      subgenres = tree['subgenres']
      for subgenre in subgenres:
        # Remove genres with the same spotify_id from the list
        genres[:] = [genre for genre in genres if genre['spotify_id'] != subgenre['spotify_id']]
        remove_genres(subgenre)

remove_genres(genre_tree)

# Print the updated list of genres
print(genres)

# Save the filtered list to a file called filtered_genre_list.json
with open('filtered_genre_list.json', 'w') as filtered_file:
  json.dump(genres, filtered_file, indent=4)