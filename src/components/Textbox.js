import React from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import '../App.css';

const insertMessage = gql`
  mutation insert_message ($message: message_insert_input! ){
    insert_message (
      objects: [$message]
    ) {
      returning {
        id
        timestamp
        text
        username
      }
    }
  }
`;

const emitTypingEvent = gql`
  mutation ($userId: Int!){
    insert_actions(objects: [
      {
        user_id: $userId,
        last_typed: "now()"
      }
    ],
      on_conflict: {
        constraint: actions_user_id_key,
        action: update
      }
    ) {
      returning {
        id
      }
    }
  }
`;

export default class Textbox extends React.Component {

  constructor(props) {
    super()
    this.state = {
      text: ""
    }
  }

  emitTypingEvent = async (mutate) => {
    console.log(this.props.userId);
    if (this.props.userId) {
      const resp = await mutate({
        mutation: emitTypingEvent,
        variables: {
          userId: this.props.userId
        }
      });
      console.log(resp);
    }
  }

  render() {
    // Mutation component. Add message to the state of <RenderMessages> after mutation.
    return (
      <Mutation
        mutation={insertMessage}
        variables={{
          message: {
            username: this.props.username,
            text: this.state.text
          }
        }}
        update={(cache, { data: { insert_message }}) => {
          this.props.mutationCallback(
            {
              id: insert_message.returning[0].id,
              timestamp: insert_message.returning[0].timestamp,
              username: insert_message.returning[0].username,
              text: insert_message.returning[0].text,
            }
          ); 
        }}
      >
        {
          (insert_message, { data, loading, error, client}) => {
            if (loading) {
              return "";
            }
            const sendMessage = () => {
              insert_message();
              this.setState({
                text: ""
              });
            }
            return (
              <form onSubmit={sendMessage}>
                <div className="textboxWrapper">
                  <input
                    id="textbox"
                    className="textbox loginTextbox"
                    value={this.state.text}
                    autoFocus={true}
                    onFocus={() => this.emitTypingEvent(client.mutate)}
                    onChange={(e) => {
                      this.setState({ text: e.target.value })
                    }}
                  />
                  <button
                    className="sendButton loginButton"
                    onClick={sendMessage}
                  > Send </button>
                </div>
              </form>
            )
          }
        }

      </Mutation>
    )
  }
}
