import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "black",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontWeight: "bold",
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName = "ellipse";

          if (route.name === "habits") {
            iconName = focused ? "flame" : "flame-outline";
          }

          if (route.name === "tasks") {
            iconName = focused ? "checkmark-circle" : "checkmark-circle-outline";
          }

          if (route.name === "rewards") {
            iconName = focused ? "gift" : "gift-outline";
          }
          if (route.name === "achievements") {
  iconName = focused ? "trophy" : "trophy-outline";
}
if (route.name === "quests") {
  iconName = focused ? "flag" : "flag-outline";
}
if (route.name === "dashboard") {
  iconName = focused ? "home" : "home-outline";
}
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="habits" options={{ title: "Habits" }} />
      <Tabs.Screen name="tasks" options={{ title: "Tasks" }} />
      <Tabs.Screen name="rewards" options={{ title: "Rewards" }}/>
      <Tabs.Screen name="achievements" options={{ title: "Awards" }} />
      <Tabs.Screen name="quests" options={{ title: "Quests" }} />
      <Tabs.Screen name="dashboard" options={{ title: "Home" }} />
    </Tabs>
  );
}